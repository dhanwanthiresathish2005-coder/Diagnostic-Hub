const express = require('express');
const mysql = require('mysql2');
const util = require('util');
const cors = require('cors');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');


const app = express();
app.use(cors());
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const saltRounds = 10;

// This acts as your temporary data store until you connect the database
let testElements = [];
// Create uploads directory if it doesn't exist
const uploadDir = './uploads/signatures/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 1. MySQL Connection Pool
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      
  password: '',      
  database: 'myapp_db'
});

// 2. Multer Configuration for Signatures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'sig-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });
const nodemailer = require('nodemailer');
const query = util.promisify(db.query).bind(db);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'dhanwanthiresathish2005@gmail.com',
        pass: 'sitm ubni tgta pnsa' 
    }
});

// 1. Configure where and how files are saved
const patientStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Get sampleId from the request body
    const sampleId = req.body.sampleId; 
    
    // Create path: uploads/patient_files/SMP-xxxx
    const dir = path.join(__dirname, 'uploads', 'patient_files', sampleId);
    
    // Create folder if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Save with timestamp to prevent name conflicts
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// 2. Define the variable that was missing
const uploadAttachment = multer({ storage: patientStorage });

// 3. YOUR EXISTING ROUTE (Now it will work!)
app.post('/api/upload-patient-files', uploadAttachment.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files received" });
    }
    res.json({ success: true, message: "Files uploaded successfully" });
});


// 1. Create a directory for Test Table Images
const testImagesDir = './uploads/test_images/';
if (!fs.existsSync(testImagesDir)){
    fs.mkdirSync(testImagesDir, { recursive: true });
}

// 2. Separate Multer Storage for Test Images 
const testImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, testImagesDir);
  },
  filename: (req, file, cb) => {
    // We'log the TestID in the filename for easier debugging
    const testId = req.body.testId || 'temp';
    cb(null, `test-${testId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadTestImage = multer({ storage: testImageStorage });

// 3. The API Route to Save to 'test_images' Table
app.post('/api/upload-test-image', uploadTestImage.single('image'), (req, res) => {
    const { testId } = req.body;
    
    // req.file.path will look like "uploads\test_images\test-101-167823.jpg"
    // We normalize slashes for web compatibility
    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

    if (!testId || !imagePath) {
        return res.status(400).json({ success: false, error: "Missing TestID or File" });
    }

    const sql = "INSERT INTO test_images (TestID, imagePath) VALUES (?, ?)";
    
    db.query(sql, [testId, imagePath], (err, result) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ success: false, error: "Failed to link image in database" });
        }
        res.status(200).json({ 
            success: true, 
            message: "Image uploaded successfully", 
            path: imagePath 
        });
    });
});


//1. customer
const pdf = require('html-pdf');
const puppeteer = require('puppeteer');

app.get('/api/generate-report/:sampleId', (req, res) => {
    const { sampleId } = req.params;

    // Captures the ?logo=true/false from frontend
    const showHeader = req.query.logo !== 'false';

    const sql = `
        SELECT 
            p.patient_name, 
            p.PatientID, 
            p.Age, 
            p.Gender,
            pb.sample_id,
            pb.client_code,
            pb.bill_date as RegDate,
            pb.Status as ReportStatus,
            pb.LabComments as GeneralLabComments,
            IFNULL(d.doctor_name, 'Self') AS doctor_name, 
            IFNULL(ca.name, 'Main Center') AS collection_center,
            up.SignaturePath,
            up.PostgraduateDegree,
            up.RegistrationNumber,
            (
                SELECT GROUP_CONCAT(
                    CONCAT_WS(':::', 
                        COALESCE(tm.TestName, prof.profile_name, 'General Test'),
                        IFNULL(pb2.ResultValue, 'Pending'),
                        IFNULL(tm.Units, 'N/A'),
                        IFNULL(tt.test_content, '[]'),
                        IFNULL(pb2.LabComments, '')
                    )
                    SEPARATOR '|||'
                )
                FROM patient_billing_details pb2
                LEFT JOIN tests tm ON pb2.TestID = tm.TestID 
                LEFT JOIN profiles prof ON pb2.profile_id = prof.id 
                LEFT JOIN test_templates tt ON tm.TestID = tt.test_id
                WHERE pb2.sample_id = pb.sample_id
            ) AS test_summary
        FROM patients p
        INNER JOIN patient_billing_details pb ON p.PatientID = pb.PatientID
        LEFT JOIN doctor_details d ON pb.doctor_id = d.id
        LEFT JOIN user_profiles up ON d.doctor_name LIKE CONCAT('%', up.FirstName, '%')
        LEFT JOIN collected_at ca ON pb.collected_at_id = ca.id 
        WHERE pb.sample_id = ?
        LIMIT 1
    `;

    db.query(sql, [sampleId], (err, results) => {
        if (err) return res.status(500).send("Database Error");
        if (results.length === 0) return res.status(404).send(`Error: No patient found`);

        const data = results[0];

        // Process test summary
        let processedTests = [];
        if (data.test_summary) {
            data.test_summary.split('|||').forEach(summary => {
                const [name, result, units, rangeJson, comments] = summary.split(':::');
                let refRange = "---";
                try {
                    const parsedRange = JSON.parse(rangeJson);
                    if (parsedRange.length > 0) refRange = parsedRange[0].range;
                } catch(e) { refRange = "---"; }

                processedTests.push({
                    name: name?.trim() || "Unknown Test",
                    result: result || "Pending",
                    units: units || "",
                    range: refRange,
                    comments: comments || ""
                });
            });
        }

        // Handle Signature
        let signatureBase64 = "";
        try {
            if (data.SignaturePath) {
                const fullPath = path.join(__dirname, data.SignaturePath.replace(/\\/g, '/'));
                if (fs.existsSync(fullPath)) {
                    const bitmap = fs.readFileSync(fullPath);
                    const ext = path.extname(fullPath).replace('.', '');
                    signatureBase64 = `data:image/${ext};base64,${bitmap.toString('base64')}`;
                }
            }
        } catch (e) { console.error("Signature Error:", e); }

        const htmlContent = `
            <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
                ${showHeader ? `
                <div style="border-bottom: 3px solid purple; padding-bottom: 10px; margin-bottom: 20px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 60%;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="position: relative; width: 40px; height: 40px;">
                                        <div style="position:absolute; left:6px; top:0; width:6px; height:40px; background:#7b1fa2; border-radius:3px;"></div>
                                        <div style="position:absolute; left:10px; top:0px; width:24px; height:24px; border:6px solid #e1bee7; border-radius:50%;"></div>
                                        <div style="position:absolute; width:12px; height:12px; background:#7b1fa2; border-radius:50%; top:12px; left:22px; transform:translate(-50%, -50%);"></div>
                                    </div>
                                    <div>
                                        <h1 style="color: purple; margin: 0; font-size: 28px;">PATHO CONSULT</h1>
                                        <p style="margin: 2px 0; font-weight: bold; color: #555;">Advanced Diagnostic & Research Centre</p>
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: right; font-size: 11px; color: #666;">
                                <p style="margin: 0;">Mylapore, Chennai - 600004</p>
                                <p style="margin: 0;">Phone: 044-24934435</p>
                                <p style="margin: 0;"><strong>ISO 9001:2015 Certified</strong></p>
                            </td>
                        </tr>
                    </table>
                </div>` : '<div style="height: 40px;"></div>'} <div style="background-color: #f9f2ff; padding: 15px; border-radius: 5px; margin-bottom: 25px; border: 1px solid #e0d0f0;">
            <table style="width: 100%; font-size: 13px; line-height: 1.8;">
                <tr>
                    <td style="width: 15%;"><strong>Patient Name</strong></td>
                    <td style="width: 35%;">: ${data.patient_name}</td>
                    <td style="width: 15%;"><strong>Client Code</strong></td>
                    <td style="width: 35%;">: ${data.client_code || 'WALK-IN'}</td>
                </tr>
                <tr>
                    <td><strong>Patient ID</strong></td>
                    <td>: ${data.PatientID}</td>
                    <td><strong>Age / Gender</strong></td>
                    <td>: ${data.Age || 'N/A'} / ${data.Gender || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Sample ID</strong></td>
                    <td>: <span style="color: purple; font-weight: bold;">${data.sample_id}</span></td>
                    <td><strong>Collected At</strong></td>
                    <td>: ${data.collection_center}</td>
                </tr>
                <tr>
                    <td><strong>Registered</strong></td>
                    <td>: ${data.RegDate ? new Date(data.RegDate).toLocaleString() : 'N/A'}</td>
                    <td><strong>Referred By</strong></td>
                    <td>: ${data.doctor_name}</td>
                </tr>
            </table>
        </div>

        <h3 style="text-align: center; text-decoration: underline; color: purple; margin-top: 0;">REPORT OF ANALYSIS</h3>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background-color: purple; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Investigation</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Result</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Units</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Reference Range</th>
                </tr>
            </thead>
            <tbody>
                ${processedTests.map(test => {
                    const isPending = test.result.toLowerCase().includes('pending');
                    return `
                    <tr>
                        <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                            <div style="font-weight: bold;">${test.name}</div>
                            ${test.comments ? `<div style="font-size: 10px; color: #777; font-style: italic;">Note: ${test.comments}</div>` : ''}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 15px; font-weight: bold; color: ${isPending ? 'red' : '#000'};">
                            ${test.result}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #666;">${test.units}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 12px;">${test.range}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>

        ${data.GeneralLabComments ? `
        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-left: 5px solid purple; background: #fafafa;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: purple;">Lab Comments:</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; line-height: 1.4;">${data.GeneralLabComments}</p>
        </div>` : ''}

        <div style="margin-top: 60px;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 60%; font-size: 11px; color: #777; vertical-align: bottom;">
                        <p>*** End of Report ***</p>
                        <p>Note: Results relate only to the sample tested. Clinical correlation is advised.</p>
                    </td>
                    <td style="text-align: center; width: 40%;">
                        ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 80px;" />` : `<div style="height: 80px;"></div>`}
                        <div style="border-top: 2px solid purple; padding-top: 5px; margin-top: 5px;">
                            <p style="margin: 0; font-size: 14px; font-weight: bold;"> ${data.doctor_name}</p>
                            <p style="margin: 0; font-size: 12px; color: purple;">${data.PostgraduateDegree || 'Consultant Pathologist'}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </body>
</html>`;

        const options = { format: 'A4', border: { top: "15mm", right: "15mm", bottom: "15mm", left: "15mm" } };

        pdf.create(htmlContent, options).toStream((err, stream) => {
            if (err) return res.status(500).send("PDF Generation Error");
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=Report_${sampleId}.pdf`);
            stream.pipe(res);
        });
    });
});
//2
app.get('/api/generate-report/:sampleId', async (req, res) => {
    const { sampleId } = req.params;
     const showHeader = req.query.logo !== 'false';

    try {
        // 1. Fetch all data needed for the report from your DB
        // You'll need: Patient info, Test results (all_tests), and Doctor details
        const [patientData] = await db.query(`
            SELECT p.*, s.sample_id, d.doctor_name, d.SignaturePath, d.PostgraduateDegree
            FROM patients p
            JOIN samples s ON p.PatientID = s.PatientID
            LEFT JOIN doctor_details d ON s.doctor_id = d.id
            WHERE s.sample_id = ?`, [sampleId]);

        const [testResults] = await db.query(`
            SELECT * FROM test_results WHERE sample_id = ?`, [sampleId]);

        if (!patientData) {
            return res.status(404).send('Report not found');
        }

        // 2. Launch Puppeteer to generate PDF
        const browser = await puppeteer.launch({ headless: "new" });
        const page = await browser.newPage();

        // 3. Define the HTML Content (Match your React Modal Styling)
        const htmlContent = `
            <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
                ${showHeader ? `
                <div style="border-bottom: 3px solid purple; padding-bottom: 10px; margin-bottom: 20px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 60%;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="position: relative; width: 40px; height: 40px;">
                                        <div style="position:absolute; left:6px; top:0; width:6px; height:40px; background:#7b1fa2; border-radius:3px;"></div>
                                        <div style="position:absolute; left:10px; top:0px; width:24px; height:24px; border:6px solid #e1bee7; border-radius:50%;"></div>
                                        <div style="position:absolute; width:12px; height:12px; background:#7b1fa2; border-radius:50%; top:12px; left:22px; transform:translate(-50%, -50%);"></div>
                                    </div>
                                    <div>
                                        <h1 style="color: purple; margin: 0; font-size: 28px;">PATHO CONSULT</h1>
                                        <p style="margin: 2px 0; font-weight: bold; color: #555;">Advanced Diagnostic & Research Centre</p>
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: right; font-size: 11px; color: #666;">
                                <p style="margin: 0;">Mylapore, Chennai - 600004</p>
                                <p style="margin: 0;">Phone: 044-24934435</p>
                                <p style="margin: 0;"><strong>ISO 9001:2015 Certified</strong></p>
                            </td>
                        </tr>
                    </table>
                </div>` : '<div style="height: 40px;"></div>'} <div style="background-color: #f9f2ff; padding: 15px; border-radius: 5px; margin-bottom: 25px; border: 1px solid #e0d0f0;">
            <table style="width: 100%; font-size: 13px; line-height: 1.8;">
                <tr>
                    <td style="width: 15%;"><strong>Patient Name</strong></td>
                    <td style="width: 35%;">: ${data.patient_name}</td>
                    <td style="width: 15%;"><strong>Client Code</strong></td>
                    <td style="width: 35%;">: ${data.client_code || 'WALK-IN'}</td>
                </tr>
                <tr>
                    <td><strong>Patient ID</strong></td>
                    <td>: ${data.PatientID}</td>
                    <td><strong>Age / Gender</strong></td>
                    <td>: ${data.Age || 'N/A'} / ${data.Gender || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Sample ID</strong></td>
                    <td>: <span style="color: purple; font-weight: bold;">${data.sample_id}</span></td>
                    <td><strong>Collected At</strong></td>
                    <td>: ${data.collection_center}</td>
                </tr>
                <tr>
                    <td><strong>Registered</strong></td>
                    <td>: ${data.RegDate ? new Date(data.RegDate).toLocaleString() : 'N/A'}</td>
                    <td><strong>Referred By</strong></td>
                    <td>: ${data.doctor_name}</td>
                </tr>
            </table>
        </div>

        <h3 style="text-align: center; text-decoration: underline; color: purple; margin-top: 0;">REPORT OF ANALYSIS</h3>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background-color: purple; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Investigation</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Result</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Units</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Reference Range</th>
                </tr>
            </thead>
            <tbody>
                ${processedTests.map(test => {
                    const isPending = test.result.toLowerCase().includes('pending');
                    return `
                    <tr>
                        <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                            <div style="font-weight: bold;">${test.name}</div>
                            ${test.comments ? `<div style="font-size: 10px; color: #777; font-style: italic;">Note: ${test.comments}</div>` : ''}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 15px; font-weight: bold; color: ${isPending ? 'red' : '#000'};">
                            ${test.result}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #666;">${test.units}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 12px;">${test.range}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>

        ${data.GeneralLabComments ? `
        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-left: 5px solid purple; background: #fafafa;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: purple;">Lab Comments:</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; line-height: 1.4;">${data.GeneralLabComments}</p>
        </div>` : ''}

        <div style="margin-top: 60px;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 60%; font-size: 11px; color: #777; vertical-align: bottom;">
                        <p>*** End of Report ***</p>
                        <p>Note: Results relate only to the sample tested. Clinical correlation is advised.</p>
                    </td>
                    <td style="text-align: center; width: 40%;">
                        ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 80px;" />` : `<div style="height: 80px;"></div>`}
                        <div style="border-top: 2px solid purple; padding-top: 5px; margin-top: 5px;">
                            <p style="margin: 0; font-size: 14px; font-weight: bold;"> ${data.doctor_name}</p>
                            <p style="margin: 0; font-size: 12px; color: purple;">${data.PostgraduateDegree || 'Consultant Pathologist'}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </body>
</html>`;
        await page.setContent(htmlContent);
        
        
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
        });

        await browser.close();

        res.contentType("application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=Report_${sampleId}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating PDF');
    }
});


// 3. AUTHENTICATION ROUTE
app.post('/api/authenticate', async (req, res) => {
  const { username, password, pin } = req.body;
  const sql = "SELECT * FROM login WHERE Username = ?";
  
  db.execute(sql, [username], async (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    if (results.length === 0) return res.status(401).json({ success: false, message: "User not found" });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.Password);
    
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    if (user.Username.toLowerCase() === 'admin') {
      const pinMatch = await bcrypt.compare(String(pin), user.Pin);
      if (!pinMatch) return res.status(403).json({ success: false, message: "Invalid Admin PIN" });
    }

    res.status(200).json({ 
      success: true, 
      role: user.Role || user.Username,
      token: "session_token_" + Date.now() 
    });
  });
});

// 4. FULL REGISTRATION ROUTE (With Role & Signature)
app.post('/api/register-full', upload.single('signature'), async (req, res) => {
    const { username, password, role, isAdmin } = req.body;
    const signaturePath = req.file ? req.file.path : null;

    try {
        const hashedPw = await bcrypt.hash(password, saltRounds);
        // Defaulting empty values for phone/address/pin to satisfy existing DB constraints
        const sql = `INSERT INTO login 
            (Username, Password, Role, IsAdmin, SignaturePath, Phone, Address, Pin, ISActive) 
            VALUES (?, ?, ?, ?, ?, '', '', '', 1)`;
        
        db.execute(sql, [username, hashedPw, role, isAdmin, signaturePath], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: "Username exists." });
                return res.status(500).json({ success: false, message: "Database failure." });
            }
            res.status(200).json({ success: true });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Encryption error." });
    }
});
//5
app.get('/api/get-users', (req, res) => {
    // Force the column names to be ID, Username, and Role
    const sql = "SELECT ID, Username, Role FROM login WHERE ISActive = 1";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.sqlMessage });
        
        // Log this to your Terminal to see exactly what is being sent to React
        console.log("Data sent to frontend:", results); 
        
        res.json({ success: true, data: results });
    });
});
//6
app.delete('/api/delete-user/:id', (req, res) => {
    const userId = req.params.id;
    
    // Instead of DELETE, we UPDATE the active status
    const sql = "UPDATE login SET ISActive = 0 WHERE ID = ?"; 

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("Database Error:", err.sqlMessage);
            return res.status(500).json({ success: false, message: err.sqlMessage });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        res.json({ success: true, message: "User deactivated successfully" });
    });
});

// 7. ADD ROLE ROUTE
app.post('/api/add-role', (req, res) => {
  const { roleName } = req.body;
  const sql = "INSERT INTO roles (role_name) VALUES (?)";
  db.execute(sql, [roleName], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error saving role" });
    res.status(200).json({ success: true });
  });
});


// 8. Get all roles to display in the table
app.get('/api/roles', (req, res) => {
  const sql = "SELECT id, role_name FROM roles ORDER BY id ASC";
  db.execute(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "Error fetching roles" });
    res.status(200).json(results);
  });
});
//9. Route to fetch all clinic locations
app.get('/api/get-locations', (req, res) => {
  // Use 'LocationID' if that is your PK, or just 'id' depending on your schema
  const sql = "SELECT LocationID, LocationCode, LocationName, IsActive FROM locations ORDER BY LocationID ASC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, message: "Error fetching locations" });
    }
    // Return the results in a 'data' object to match your frontend expectation
    res.status(200).json({ success: true, data: results });
  });
});

// 10.Delete a role
app.delete('/api/roles/:id', (req, res) => {
  const sql = "DELETE FROM roles WHERE id = ?";
  db.execute(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Error deleting role" });
    res.status(200).json({ success: true });
  });
});

// 11. ADD LOCATION ROUTE
app.post('/api/add-location', (req, res) => {
  const { code, name } = req.body;
  const sql = "INSERT INTO locations (LocationCode, LocationName) VALUES (?, ?)";
  
  db.execute(sql, [code, name], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database error" });
    res.status(200).json({ success: true });
  });
});

//12. New Pathologist Registration Route (Handling Login + User Profiles)

app.post('/api/register-pathologist', upload.single('signature'), async (req, res) => {
    const {
        userName, firstName, lastName, gender, dob, age,
        undergraduateDegree, postgraduateDegree, registrationNumber, 
        designationCategory, designationForReport
    } = req.body;

    let signaturePath = req.file ? req.file.path : null;

    // --- 1. IMAGE PROCESSING WITH SHARP ---
    if (req.file) {
        try {
            const processedFilename = `processed-${Date.now()}-${req.file.filename}`;
            const processedPath = path.join('uploads', processedFilename); 

            await sharp(req.file.path)
                .grayscale()            
                .normalize()            
                .threshold(180)         
                .resize(400, 200, {     
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .toFile(processedPath);

            
            fs.unlinkSync(req.file.path);
            
            
            signaturePath = processedPath.replace(/\\/g, '/'); 
        } catch (sharpErr) {
            console.error("Sharp processing failed, using original:", sharpErr);
        }
    }

    // --- 2. DATABASE TRANSACTION ---
    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ success: false, message: "DB Connection Error" });

        connection.beginTransaction(async (err) => {
            try {
                const hashedPw = await bcrypt.hash("patho123", 10);
                const loginSql = "INSERT INTO login (Username, Password, Role, ISActive) VALUES (?, ?, 'Pathologist', 1)";
                
                connection.query(loginSql, [userName, hashedPw], (err, loginResult) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            const msg = err.code === 'ER_DUP_ENTRY' ? "Username already exists." : "Login table error.";
                            res.status(400).json({ success: false, message: msg });
                        });
                    }

                    const newUserId = loginResult.insertId;

                    const profileSql = `
                        INSERT INTO user_profiles 
                        (user_id, FirstName, LastName, designation, Gender, DOB, Age, 
                        UndergraduateDegree, PostgraduateDegree, RegistrationNumber, 
                        DesignationForReport, SignaturePath) 
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                    const profileValues = [
                        newUserId, firstName, lastName, designationCategory, gender, 
                        dob || null, age || null, undergraduateDegree, postgraduateDegree, 
                        registrationNumber, designationForReport, signaturePath
                    ];

                    connection.query(profileSql, profileValues, (err, profileResult) => {
                        if (err) {
                            return connection.rollback(() => {
                                connection.release();
                                res.status(500).json({ success: false, message: "Error saving profile details." });
                            });
                        }

                        connection.commit((err) => {
                            if (err) return connection.rollback(() => { throw err; });
                            connection.release();
                            res.status(200).json({ 
                                success: true, 
                                message: "Pathologist registered successfully!",
                                profileId: profileResult.insertId 
                            });
                        });
                    });
                });
            } catch (error) {
                connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ success: false, message: "Server processing error." });
                });
            }
        });
    });
});


//13. New API to fetch pre-registration details
app.get('/api/fetch-profile/:id', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT FirstName, LastName FROM user_profiles WHERE profile_id = ?";

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        if (results.length > 0) {
            res.json({ success: true, data: results[0] });
        } else {
            res.status(404).json({ success: false, message: "Profile not found" });
        }
    });
});

//14
app.get('/api/get-out-hospitals', (req, res) => {
    const sql = "SELECT id, HospitalName FROM out_of_hospital_clients WHERE IsActive = 1 ORDER BY HospitalName ASC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: results });
    });
});

// 15. Route to register hospital (Matches LocationCode, HospitalName, CreatedAt)
app.post('/api/register-hospital-only', (req, res) => {
    const { location, hospitalName, createDate } = req.body;
    
    // Updated column names to match your MariaDB 'describe' output
    const sql = "INSERT INTO out_of_hospital_clients (LocationCode, HospitalName, CreatedAt, IsActive) VALUES (?, ?, ?, 1)";
    
    db.query(sql, [location, hospitalName, createDate], (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: err.sqlMessage });
        }
        res.json({ success: true, clientId: result.insertId });
    });
});

// 16. Route to add test rates (Matches client_id, TestProfileName, Amount)
app.post('/api/add-hospital-test-rate', (req, res) => {
    const { clientId, testProfile, amount } = req.body;
    const sql = "INSERT INTO out_of_hospital_rates (client_id, TestProfileName, Amount) VALUES (?, ?, ?)";
    
    db.query(sql, [clientId, testProfile, amount || 0], (err) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: err.sqlMessage });
        }
        res.status(200).json({ success: true, message: "Test added successfully!" });
    });
});

//17. Fetch all active Tests
app.get('/api/get-all-test', (req, res) => {
    const sql = "SELECT TestID, TestName, Price FROM tests WHERE IsActive = 1 ORDER BY TestName ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

//18
app.get('/api/get-hospital-rates/:id', (req, res) => {
    const sql = "SELECT * FROM out_of_hospital_rates WHERE client_id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});
//19
app.delete('/api/delete-hospital-rate/:id', (req, res) => {
    const sql = "DELETE FROM out_of_hospital_rates WHERE id = ?";
    db.query(sql, [req.params.id], (err) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

//20. NEW UNIQUE ROUTE - specifically for Sub-Profiles
app.get('/api/get-subprofile-list', (req, res) => {
    // We add profile_code here so your table isn't empty
    const sql = "SELECT id, profile_name, profile_code, amount FROM profiles ORDER BY profile_name ASC";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        // IMPORTANT: We send the 'results' array directly 
        // This makes sure .map() works in React immediately
        res.status(200).json(results); 
    });
});

//21.
app.get('/api/get-lab-tests', (req, res) => {
    // We use TestID from tests and id from profiles, aliasing both as 'id'
    const sql = `
        SELECT id, profile_code AS code, profile_name AS name, amount, 'profile' AS item_type 
        FROM profiles
        UNION ALL
        SELECT TestID AS id, TestCode AS code, TestName AS name, Price AS amount, 'test' AS item_type 
        FROM tests
        ORDER BY name ASC`;
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err); // Log the error for debugging
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(200).json({ success: true, data: results });
    });
});

//22
app.post('/api/add-out-of-hospital', (req, res) => {
    // Destructure everything coming from React
    const { location, hospitalName, createDate, testProfile, amount } = req.body;

    console.log("Incoming Data:", { location, hospitalName, createDate, testProfile, amount });

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ success: false, message: "DB Connection Error" });

        connection.beginTransaction((err) => {
            if (err) { connection.release(); return res.status(500).json({ success: false }); }

            // STEP 1: Insert Hospital
            const sqlClient = "INSERT INTO out_of_hospital_clients (LocationCode, HospitalName, CreatedAt) VALUES (?, ?, ?)";
            connection.query(sqlClient, [location, hospitalName, createDate], (err, result) => {
                if (err) {
                    return connection.rollback(() => {
                        connection.release();
                        console.error("Client Insert Error:", err.sqlMessage);
                        res.status(500).json({ success: false, message: err.sqlMessage });
                    });
                }

                const clientId = result.insertId;
                
                // STEP 2: Insert Rates
                // We use || 0 to ensure the decimal column gets a number even if 'amount' is empty
                const finalAmount = amount || 0;
                const sqlRate = "INSERT INTO out_of_hospital_rates (client_id, TestProfileName, Amount) VALUES (?, ?, ?)";
                
                connection.query(sqlRate, [clientId, testProfile, finalAmount], (err) => {
                    if (err) {
                        return connection.rollback(() => {
                            connection.release();
                            console.error("Rates Insert Error:", err.sqlMessage);
                            // This will send the EXACT database error back to your browser alert
                            res.status(500).json({ success: false, message: "Database Error: " + err.sqlMessage });
                        });
                    }

                    // STEP 3: Commit
                    connection.commit((err) => {
                        if (err) return connection.rollback(() => { throw err; });
                        connection.release();
                        res.status(200).json({ success: true, message: "Stored Successfully!" });
                    });
                });
            });
        });
    });
});

//23
app.post('/api/add-group', (req, res) => {
    const { 
        groupName, numPersons, amount, location, 
        hospitalName, referredBy, clientCode, clientName, 
        sampleCollect, paymentMode, paidAmount, netAmount, 
        profileTest,
        collected_at_id, 
        addedTests, // Array of selected items from React
        acc_holder, acc_no, cheque_no, bank_name, trans_id, digital_mode, status 
    } = req.body;

    // --- LOGIC FIX: Extract IDs based on React property names ---
    
    // 1. We filter by uppercase 'TEST' and map 'dbId' as defined in your React handleAddTest
    const selected_test_ids = addedTests && Array.isArray(addedTests)
        ? addedTests
            .filter(item => item.type === 'TEST') 
            .map(item => item.dbId) 
            .join(',') || null
        : null;

    // 2. We filter by uppercase 'PROFILE' and map 'dbId'
    const selected_profile_ids = addedTests && Array.isArray(addedTests)
        ? addedTests
            .filter(item => item.type === 'PROFILE')
            .map(item => item.dbId)
            .join(',') || null
        : null;

    const sql = `INSERT INTO groups 
        (GroupName, NumPersons, TotalAmount, ProfileTest, LocationCode, 
        HospitalName, ReferredBy, ClientCode, ClientName, SampleCollect, 
        PaymentMode, PaidAmount, NetAmount, collected_at_id, 
        selected_test_ids, selected_profile_ids, 
        acc_holder, acc_no, cheque_no, bank_name, trans_id, digital_mode, status,
        CreatedAt) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;

    const values = [
        groupName || null, 
        parseInt(numPersons) || 0, 
        parseFloat(amount) || 0, 
        profileTest || null,      
        location || null,          
        hospitalName || null, 
        referredBy || null, 
        clientCode || null, 
        clientName || null, 
        sampleCollect || 'No',
        paymentMode || null, 
        parseFloat(paidAmount) || 0, 
        parseFloat(netAmount) || 0,
        collected_at_id || null,
        selected_test_ids,    // Successfully populated string (e.g., "1,5")
        selected_profile_ids, // Successfully populated string (e.g., "4,10")
        acc_holder || null,
        acc_no || null,
        cheque_no || null,
        bank_name || null,
        trans_id || null,
        digital_mode || null,
        status || 'Pending'
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("MariaDB Error Details:", err.message);
            return res.status(500).json({ 
                success: false, 
                message: "Database insertion failed: " + err.message 
            });
        }
        res.status(200).json({ 
            success: true, 
            insertId: result.insertId 
        });
    });
});
//24. Get all hospitals (or filter by location if query param exists)
app.get('/api/get-hospitals', (req, res) => {
    const { locationCode } = req.query;
    
    let sql = "SELECT id, HospitalName, LocationCode FROM out_of_hospital_clients WHERE IsActive = 1";
    let params = [];

    if (locationCode) {
        sql += " AND LocationCode = ?";
        params.push(locationCode);
    }

    db.query(sql, params, (err, data) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, data });
    });
});
//25
app.get('/api/get-clients', (req, res) => {
    // Corrected table name to 'client_codes' based on your MariaDB output
    const sql = "SELECT id, client_code, client_name FROM client_codes ORDER BY client_name ASC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err.message);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true, data: results });
    });
});
//26
app.get('/api/get-profiles', (req, res) => {
    // ADDED 'priority' to the SELECT statement
    const sql = "SELECT id, profile_code, profile_name, amount, priority FROM profiles ORDER BY profile_name ASC";
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

// 27Add this to your backend server file
app.get('/api/rates/list', (req, res) => {
    // This query pulls the necessary fields for your Rate Card table
    const sql = "SELECT id, profile_name, amount, priority FROM profiles ORDER BY profile_name ASC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        // Send the data back in the format your frontend expects
        res.json({ success: true, data: results });
    });
});

//28 Fetch Doctors (from doctor_details table)
app.get('/api/get-doctors', (req, res) => {
    const sql = "SELECT id, doctor_name FROM doctor_details ORDER BY doctor_name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

//29 Add this to your server.js to handle the password update
app.put('/api/update-password', async (req, res) => {
    const { username, newPassword } = req.body;

    try {
        // Hash the new password before saving
        const hashedPw = await bcrypt.hash(newPassword, 10);
        
        // SQL query to update the specific user
        const sql = "UPDATE login SET Password = ? WHERE Username = ?";
        
        db.execute(sql, [hashedPw, username], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Database error" });
            }
            // Check if the username actually existed in the table
            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: "User not found" });
            }
            res.status(200).json({ success: true, message: "Password updated!" });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});
//30. Route to fetch all users with a non-null role
app.get('/api/get-users', (req, res) => {
    // We select only necessary fields and filter out users with no role
    const sql = "SELECT id, Username, Role, IsAdmin, ISActive FROM login WHERE Role IS NOT NULL AND Role != '' ORDER BY id DESC";
    
    db.execute(sql, (err, results) => {
        if (err) {
            console.error("Fetch error:", err);
            return res.status(500).json({ success: false, message: "Error fetching users" });
        }
        res.status(200).json({ success: true, data: results });
    });
});
//31. --- TITLE ROUTES ---
app.get('/api/titles', (req, res) => {
    db.query("SELECT * FROM titles", (err, result) => {
        if (err) res.json({ success: false, message: err.message });
        else res.json({ success: true, data: result });
    });
});

//32
app.post('/api/add-title', (req, res) => {
    const { titleName } = req.body;
    db.query("INSERT INTO titles (title_name) VALUES (?)", [titleName], (err) => {
        if (err) res.json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

//33
app.delete('/api/delete-title/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM titles WHERE id = ?", [id], (err) => {
        if (err) res.json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});

//34
app.put('/api/update-title/:id', (req, res) => {
    const { id } = req.params;
    const { titleName } = req.body;
    db.query("UPDATE titles SET title_name = ? WHERE id = ?", [titleName, id], (err) => {
        if (err) res.json({ success: false, message: err.message });
        else res.json({ success: true });
    });
});
// --- COLLECTED AT ROUTES ---
app.get('/api/collected-at', (req, res) => {
    db.query("SELECT * FROM collected_at", (err, result) => {
        res.json({ success: !err, data: result });
    });
});
//35
app.post('/api/add-collected', (req, res) => {
    const { name, amount } = req.body;
    db.query("INSERT INTO collected_at (name, amount) VALUES (?, ?)", [name, amount], (err) => {
        res.json({ success: !err });
    });
});

//36
app.delete('/api/delete-collected/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM collected_at WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "Record deleted" });
    });
});


//37

app.put('/api/update-collected/:id', (req, res) => {
    const { id } = req.params;
    const { name, amount } = req.body;
    db.query(
        "UPDATE collected_at SET name = ?, amount = ? WHERE id = ?", 
        [name, amount, id], 
        (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err });
            res.json({ success: true, message: "Record updated" });
        }
    );
});

//38. insurance
app.post('/api/add-insurance', (req, res) => {
    const { 
        location, 
        insuranceName, 
        insuranceDate, 
        profileTest, 
        clientCode, 
        existingAmount, 
        amount 
    } = req.body;

    // 2. The SQL query (Ensure table name matches: insurance OR insurance_pricing)
    const sql = `
        INSERT INTO insurance 
        (location, insurance_name, insurance_date, profile_test, client_code, existing_amount, amount) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // 3. Map the data to the parameters
    const params = [
        location || null, 
        insuranceName || null, 
        insuranceDate || null, 
        profileTest || null, 
        clientCode || null, 
        existingAmount || 0, 
        amount || 0
    ];

    // 4. Execute
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("❌ MariaDB Insert Error:", err.message);
            return res.status(500).json({ 
                success: false, 
                error: err.message 
            });
        }
        
        console.log("✅ Insurance Data Saved, ID:", result.insertId);
        res.json({ 
            success: true, 
            message: "Data saved successfully",
            id: result.insertId 
        });
    });
});

//39
app.get('/api/insurance-master-data', (req, res) => {
    const queries = {
        locations: 'SELECT LocationName FROM locations WHERE IsActive = 1',
        clients: 'SELECT client_code, client_name FROM client_codes',
        tests: 'SELECT TestName, Price FROM tests WHERE IsActive = 1',
        profiles: 'SELECT profile_name, amount FROM profiles'
    };

    // Running queries sequentially for stability
    db.query(queries.locations, (err, locations) => {
        db.query(queries.clients, (err, clients) => {
            db.query(queries.tests, (err, tests) => {
                db.query(queries.profiles, (err, profiles) => {
                    if (err) return res.status(500).json({ success: false, error: err.message });

                    res.json({
                        success: true,
                        locations,
                        clients,
                        services: [
                            ...tests.map(t => ({ name: t.TestName, price: t.Price })),
                            ...profiles.map(p => ({ name: p.profile_name, price: p.amount }))
                        ]
                    });
                });
            });
        });
    });
});

//40.
app.post('/api/create-insurance-header', (req, res) => {
    const { location, insuranceName, insuranceDate } = req.body;

    // Generate unique code: e.g., TPA-2026-A1B2
    const year = new Date().getFullYear();
    const randomHex = Math.random().toString(16).toUpperCase().substring(2, 6);
    const autoPolicyNo = `TPA-${year}-${randomHex}`;

    // Verify this SQL matches your updated table
    const sql = "INSERT INTO insurance_headers (location, insurance_name, insurance_date, policy_tpa_number) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [location, insuranceName, insuranceDate, autoPolicyNo], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        // Return both the ID and the new Policy Number
        res.json({ 
            success: true, 
            headerId: result.insertId,
            generatedPolicy: autoPolicyNo 
        });
    });
});

//41.  STEP 2: Add specific tests/profiles to that Insurance ID
app.post('/api/add-insurance-test-detail', (req, res) => {
    const { headerId, clientCode, profileTest, amount } = req.body;
    const sql = "INSERT INTO insurance_details (header_id, client_code, test_profile, amount) VALUES (?, ?, ?, ?)";
    
    db.query(sql, [headerId, clientCode, profileTest, amount], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true });
    });
});

//42.  STEP 3: Fetch applied tests for the grid
app.get('/api/get-insurance-rates/:id', (req, res) => {
    const sql = "SELECT * FROM insurance_details WHERE header_id = ?";
    db.query(sql, [req.params.id], (err, data) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data });
    });
});

//43.  NEW: Fetch saved insurance headers for the dropdown
app.get('/api/get-insurance-headers', (req, res) => {
    const sql = "SELECT id, insurance_name FROM insurance_headers ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data });
    });
});

//44.  server.js query update
app.get('/api/get-saved-insurances', (req, res) => {
    // Ensure 'policy_tpa_number' is in the SELECT clause
    const sql = "SELECT id, insurance_name, policy_tpa_number FROM insurance_headers ORDER BY id DESC";
    db.query(sql, (err, data) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data });
    });
});

//45
app.get('/api/doctors/filter', (req, res) => {
    const searchTerm = req.query.search;
    let sql = "SELECT * FROM doctor_details";
    let params = [];

    if (searchTerm) {
        const pattern = `%${searchTerm}%`;
        sql += ` WHERE 
            doctor_name LIKE ? OR 
            email_id LIKE ? OR 
            phone_no LIKE ? OR 
            id LIKE ?`;
        params = [pattern, pattern, pattern, pattern];
    }

    sql += " ORDER BY id DESC";

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, data: results });
    });
});

//46
app.delete('/api/delete-doctor/:id', (req, res) => {
    const { id } = req.params;
    const query = "DELETE FROM doctor_details WHERE id = ?";
    
    db.query(query, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true });
    });
});

//47 Add or Update Doctor
app.post('/api/add-doctor', (req, res) => {
    const { id, doctorName, emailId, phoneNo, notification } = req.body;

    if (id) {
        // UPDATE existing doctor
        const query = "UPDATE doctor_details SET doctor_name = ?, email_id = ?, phone_no = ?, notification_required = ? WHERE id = ?";
        db.query(query, [doctorName, emailId, phoneNo, notification, id], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err });
            res.json({ success: true, message: "Updated successfully" });
        });
    } else {
        // INSERT new doctor
        const query = "INSERT INTO doctor_details (doctor_name, email_id, phone_no, notification_required) VALUES (?, ?, ?, ?)";
        db.query(query, [doctorName, emailId, phoneNo, notification], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: err });
            res.json({ success: true, message: "Added successfully" });
        });
    }
});

//48
app.post('/api/add-doctor', (req, res) => {
    const { id, doctorName, emailId, phoneNo, notification } = req.body;

    let query;
    let queryParams;

    if (id) {
        query = "UPDATE doctor_details SET doctor_name = ?, email_id = ?, phone_no = ?, notification_required = ? WHERE id = ?";
        queryParams = [doctorName, emailId, phoneNo, notification, id];
    } else {
        query = "INSERT INTO doctor_details (doctor_name, email_id, phone_no, notification_required) VALUES (?, ?, ?, ?)";
        queryParams = [doctorName, emailId, phoneNo, notification];
    }

    db.query(query, queryParams, (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, error: err });
        }

        // Send Email if notification is 'Yes'
        if (notification === 'Yes' && emailId) {
            console.log(`Attempting to send email to: ${emailId}`);
            
            const mailOptions = {
                from: `"Patho Consult Diagnostics" <dhanwanthiresathish2005@gmail.com>`,
                to: emailId,
                subject: `Registration Successful - Dr. ${doctorName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; border: 1px solid #4a148c; padding: 20px; border-radius: 10px;">
                        <h2 style="color: #4a148c;">Welcome to Patho Consult</h2>
                        <p>Hello <strong>Dr. ${doctorName}</strong>,</p>
                        <p>You have been successfully registered in our diagnostic management system.</p>
                        <hr />
                        <p><strong>Registered Email:</strong> ${emailId}</p>
                        <p><strong>Contact Number:</strong> ${phoneNo}</p>
                        <br/>
                        <p>Regards,<br/><strong>Patho Consult Admin Team</strong></p>
                    </div>
                `
            };

            transporter.sendMail(mailOptions, (mailErr, info) => {
                if (mailErr) {
                    console.error("Mail Delivery Error:", mailErr);
                } else {
                    console.log("Email sent successfully: " + info.response);
                }
            });
        }

        res.json({ success: true, message: id ? "Updated" : "Added" });
    });
});

//49
app.post('/api/add-client-code', (req, res) => {
    const { id, location, clientName, code, emailId, phoneNo, panNo, address, notification } = req.body;
    let sql = "";
    let params = [];

    if (id) {
        // UPDATE Logic
        sql = `UPDATE client_codes SET 
               location=?, client_name=?, client_code=?, email_id=?, 
               phone_no=?, pan_no=?, address=?, notification_required=? 
               WHERE id = ?`;
        params = [location, clientName, code, emailId, phoneNo, panNo, address, notification, id];
    } else {
        // INSERT Logic
        sql = `INSERT INTO client_codes 
               (location, client_name, client_code, email_id, phone_no, pan_no, address, notification_required) 
               VALUES (?,?,?,?,?,?,?,?)`;
        params = [location, clientName, code, emailId, phoneNo, panNo, address, notification];
    }

    // Execute Database Query
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, error: "Database error" });
        }

        // --- EMAIL LOGIC STARTS HERE ---
        // We only send mail if notification is 'Yes' AND we have an email address
        if (notification === 'Yes' && emailId) {
            const mailOptions = {
                from: `"Patho Consult Diagnostics" <${process.env.EMAIL_USER}>`,
                to: emailId,
                subject: `Welcome ${clientName} - Client Registration Successful`,
                html: `
                    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
                        <h2 style="color: #4a148c;">Welcome to Our System!</h2>
                        <p>Hello <strong>${clientName}</strong>,</p>
                        <p>Your client registration has been successfully processed.</p>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Client Code:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${code}</td></tr>
                            <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Location:</strong></td><td style="padding: 8px; border: 1px solid #eee;">${location}</td></tr>
                        </table>
                        <p>Please find the attached welcome guide for more details.</p>
                        <br/>
                        <p>Best Regards,<br/>Admin Team</p>
                    </div>
                `,
                attachments: [
    {
        filename: 'WelcomeGuide.pdf',
        path: path.join(__dirname, 'files', 'WelcomeGuide.pdf') 
    }
]
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Email failed to send:", error);
                } else {
                    console.log("Email sent successfully: " + info.response);
                }
            });
        }

        res.json({ 
            success: true, 
            message: id ? "Updated successfully" : "Added successfully" 
        });
    });
});

//50.  Get Client Codes
app.get('/api/client-codes', (req, res) => {
    db.query("SELECT * FROM client_codes ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json({ success: false, data: [] });
        res.json({ success: true, data: result }); 
    });
});

//51
app.delete('/api/delete-client-code/:id', (req, res) => {
    const sql = "DELETE FROM client_codes WHERE id = ?";
    db.execute(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        res.status(200).json({ success: true, message: "Client deleted successfully" });
    });
});
//52
app.get('/api/clients/filter', (req, res) => {
    const searchTerm = req.query.search;

    let sql = "SELECT * FROM client_codes";
    let params = [];

    if (searchTerm) {
        const pattern = `%${searchTerm}%`;
        sql += ` WHERE 
            client_name LIKE ? OR 
            client_code LIKE ? OR 
            email_id LIKE ? OR 
            phone_no LIKE ? OR 
            pan_no LIKE ? OR 
            notification_required LIKE ? OR
            address LIKE ? OR 
            location LIKE ? OR
            id LIKE ?`;
        
        // There are 9 question marks above, so we provide the pattern 9 times
        params = [pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern, pattern];
    }

    sql += " ORDER BY id DESC";

    // Use db.query (or db.execute) with the params array
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("SQL Error Detail:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, data: results });
    });
});
//53
app.get('/api/registration-metadata', (req, res) => {
    const titlesQuery = "SELECT id, title_name FROM titles";
    const doctorsQuery = "SELECT id, doctor_name FROM doctor_details"; 

    db.query(titlesQuery, (err, titleResults) => {
        if (err) return res.status(500).json(err);
        db.query(doctorsQuery, (err, doctorResults) => {
            if (err) return res.status(500).json(err);
            res.json({ 
                titles: titleResults, 
                doctors: doctorResults 
            });
        });
    });
});

//54
app.get('/api/get-all-patients', (req, res) => {
    const sql = `
        SELECT 
        b.id AS id,
            p.PatientID,
            p.RegDate,              
            ti.title_name,          -- JOINed from the titles table
            p.patient_name, 
            p.gender, 
            p.age, 
            p.email,
            p.external_id, 
            p.phone_no,
            d.doctor_name,
            COALESCE(b.Amount, 0) AS Amount, 
            COALESCE(b.amount_paid, 0) AS amount_paid, 
            COALESCE(b.balance, 0) AS balance, 
            COALESCE(b.Status, 'New') AS current_status,
            GROUP_CONCAT(DISTINCT t.TestName SEPARATOR ', ') AS test_names
        FROM patients p
        LEFT JOIN titles ti ON p.title_id = ti.id  -- The Join logic
        LEFT JOIN doctor_details d ON p.doctor_id = d.id
        LEFT JOIN (
            SELECT pb1.* FROM patient_billing_details pb1
            WHERE pb1.id = (SELECT MAX(id) FROM patient_billing_details pb2 WHERE pb2.PatientID = pb1.PatientID)
        ) b ON p.PatientID = b.PatientID
        LEFT JOIN tests t ON b.TestID = t.TestID
        GROUP BY p.PatientID
        ORDER BY p.RegDate DESC; 
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ success: false, error: "Database fetch failed" });
        }
        res.json(results); 
    });
});

// 55. Get a single patient's current data
app.get('/api/get-patient/:id', (req, res) => {
    const patientId = req.params.id;
    const sql = `
        SELECT p.*, 
        (SELECT b.doctor_id 
         FROM patient_billing_details b 
         WHERE b.patient_name = p.patient_name 
         ORDER BY b.id DESC LIMIT 1) as doctor_id
        FROM patients p 
        WHERE p.PatientID = ?`;

    db.query(sql, [patientId], (err, result) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Patient not found" });
        }

        res.json({ success: true, data: result[0] });
    });
});

//56
app.put('/api/update-patient/:id', (req, res) => {
    // Added 'email' and 'dob' to the destructuring
    const { title_id, patient_name, age, gender, phone_no, doctor_id, email, dob } = req.body;
    
    const sql = `
        UPDATE patients 
        SET title_id = ?, 
            patient_name = ?, 
            age = ?, 
            gender = ?, 
            phone_no = ?, 
            doctor_id = ?,
            email = ?,
            dob = ? 
        WHERE PatientID = ?`;
    
    const values = [title_id, patient_name, age, gender, phone_no, doctor_id, email, dob, req.params.id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }
        res.json({ success: true, message: "Patient updated successfully" });
    });
});

// 56. Register new patient
app.post('/api/add-patient', (req, res) => {
    // Added 'email' and 'dob'
    const { title_id, patient_name, age, gender, phone_no, doctor_id, email, dob } = req.body;
    if (!title_id || !patient_name) {
        return res.status(400).json({ 
            success: false, 
            error: "Please fill all required fields (Title and Name)." 
        });
    }

    const sql = `INSERT INTO patients 
        (title_id, patient_name, age, gender, phone_no, doctor_id, email, dob) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const values = [title_id, patient_name, age, gender, phone_no, doctor_id || null, email, dob];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ 
                success: false, 
                error: "Database save failed: " + err.sqlMessage 
            });
        }
        res.json({ success: true, message: "Patient registered successfully!", patientId: result.insertId });
    });
});
//57
app.post('/api/register-patient', (req, res) => {
    const d = req.body; 
    const sql = `INSERT INTO patients (
        title_id, patient_name, age, gender, phone_no, email, dob, RegDate, 
        external_id, client_code,
        door_no, flat_name, street_name1, street_name2, city, state, pincode, country,
        phone_home, locality, marital_status, notify_sms, notify_email, 
        group_name, social_relationship, social_name, employment_status, employer_name, 
        income_group, GroupID,Location
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const values = [
        d.title_id, d.patient_name, d.age, d.gender, d.phone_no, d.email, d.dob || null, new Date(), 
        d.external_id, d.client_code, 
        d.door_no, d.flat_name, d.street_name1, d.street_name2, d.city, d.state, d.pincode, d.country,
        d.phone_home, d.locality, d.marital_status, d.notify_sms ? 1 : 0, d.notify_email ? 1 : 0,
        d.group_name, d.social_relationship, d.social_name, d.employment_status, d.employer_name, 
        d.income_group, 
        d.GroupID || null ,
        d.Location || null
        
    ];

    db.query(sql, values, (err, result) => {
    if (err) {
        console.error("Save Error:", err);
        return res.status(500).json({ success: false, error: err.sqlMessage });
    }
    res.json({ success: true, message: "Record Saved!", patientId: result.insertId });
});
});

//58
app.get('/api/next-external-id', (req, res) => {
    const sql = "SELECT COUNT(*) AS count FROM patients";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        
        const count = result[0].count;
        // Example format: P-1001, P-1002, etc.
        const nextId = `P-${1000 + count + 1}`; 
        res.json({ nextId });
    });
});
//59

app.get('/api/customer-view-full', (req, res) => {
    const { fromDate, toDate } = req.query;
    const start = fromDate || new Date().toISOString().split('T')[0];
    const end = toDate || new Date().toISOString().split('T')[0];

    const sql = `
SELECT 
    p.patient_name, p.PatientID, p.external_id, p.age, p.gender, p.email,
    IFNULL(p.client_code, pb.client_code) AS client_code,
    COALESCE(pb.sample_id, p.sample_id, 'N/A') AS sample_id,
    IFNULL(pb.invoice_no, 'N/A') AS invoice_no,
    IFNULL(pb.billing_type, 'N/A') AS billing_type,
    IFNULL(d.doctor_name, 'Self') AS referred_by, 
    IFNULL(ca.name, 'Main Center') AS collected_at, 
    
    -- FIX: Total Billed / Saved (Should count all records to match billed)
    COUNT(pb.id) AS total_test_billed,
    COUNT(pb.id) AS test_saved, 

    -- Progress tracking
    SUM(CASE WHEN pb.Status = 'Confirmed' THEN 1 ELSE 0 END) AS confirmed_test,
    SUM(CASE WHEN pb.Status = 'Approved' THEN 1 ELSE 0 END) AS approved_test,
    (COUNT(pb.id) - SUM(CASE WHEN pb.Status = 'Approved' THEN 1 ELSE 0 END)) AS test_pending_approval,

    -- ALIGNMENT: Match lab_status logic with Lab View
    CASE 
        WHEN COUNT(pb.id) = 0 THEN 'No Tests'
        WHEN SUM(CASE WHEN pb.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(pb.id) THEN 'Completed'
        WHEN SUM(CASE WHEN pb.Status = 'Approved' THEN 1 ELSE 0 END) > 0 THEN 'In Progress'
        ELSE 'Pending'
    END AS lab_status,

    -- ALIGNMENT: Processing/Completed status logic
    CASE 
        WHEN SUM(CASE WHEN pb.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(pb.id) AND COUNT(pb.id) > 0 THEN 'Completed'
        ELSE 'Processing'
    END AS status,
    
    IF(SUM(CASE WHEN pb.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(pb.id) AND COUNT(pb.id) > 0, 'Yes', 'No') AS test_completed,

    DATE_FORMAT(p.RegDate, '%d-%m-%Y %H:%i') AS invoice_date, 

    -- Activity Log Subqueries
    (SELECT MAX(created_at) FROM activity_log WHERE sample_id = pb.sample_id AND action_type = 'PRINT') AS last_print_date,
    (SELECT MAX(created_at) FROM activity_log WHERE sample_id = pb.sample_id AND action_type = 'EMAIL') AS email_sent_date,
    (SELECT COUNT(*) FROM activity_log WHERE sample_id = pb.sample_id AND action_type = 'PRINT') AS total_print_count,
    (SELECT COUNT(*) FROM activity_log WHERE sample_id = pb.sample_id AND action_type = 'EMAIL') AS total_emails_sent

FROM patients p
LEFT JOIN patient_billing_details pb ON p.PatientID = pb.PatientID
LEFT JOIN doctor_details d ON pb.doctor_id = d.id
LEFT JOIN collected_at ca ON pb.collected_at_id = ca.id
WHERE DATE(p.RegDate) BETWEEN ? AND ?
GROUP BY p.PatientID, pb.sample_id, pb.invoice_no
ORDER BY p.RegDate DESC
`;

    db.query(sql, [start, end], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

//60
app.post('/api/log-activity', (req, res) => {
    const { sampleId, actionType } = req.body;

    // Validation: Don't log if there is no valid sample ID
    if (!sampleId || sampleId === 'N/A' || sampleId === 'PENDING') {
        return res.status(400).json({ success: false, message: "Invalid Sample ID" });
    }

    const sql = "INSERT INTO activity_log (sample_id, action_type) VALUES (?, ?)";
    db.query(sql, [sampleId, actionType], (err, result) => {
        if (err) {
            console.error("Log Error:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

//61
app.post('/api/send-report-mail', async (req, res) => {
    const { email, sampleId } = req.body;
    const showHeader = req.query.logo !== 'false';

    if (!email) {
        return res.status(400).json({ success: false, error: "Recipient email is required." });
    }

    // 1. Fetch FULL data exactly like the generate-report logic
    const sql = `
        SELECT 
            p.patient_name, p.PatientID, p.Age, p.Gender,
            pb.sample_id, pb.client_code, pb.bill_date as RegDate,
            pb.LabComments as GeneralLabComments,
            IFNULL(d.doctor_name, 'Self') AS doctor_name, 
            IFNULL(ca.name, 'Main Center') AS collection_center,
            up.SignaturePath, up.PostgraduateDegree, up.RegistrationNumber,
            (
                SELECT GROUP_CONCAT(
                    CONCAT_WS(':::', 
                        COALESCE(tm.TestName, prof.profile_name, 'General Test'),
                        IFNULL(pb2.ResultValue, 'Pending'),
                        IFNULL(tm.Units, 'N/A'),
                        IFNULL(tt.test_content, '[]'),
                        IFNULL(pb2.LabComments, '')
                    )
                    SEPARATOR '|||'
                )
                FROM patient_billing_details pb2
                LEFT JOIN tests tm ON pb2.TestID = tm.TestID 
                LEFT JOIN profiles prof ON pb2.profile_id = prof.id 
                LEFT JOIN test_templates tt ON tm.TestID = tt.test_id
                WHERE pb2.sample_id = pb.sample_id
            ) AS test_summary
        FROM patients p
        INNER JOIN patient_billing_details pb ON p.PatientID = pb.PatientID
        LEFT JOIN doctor_details d ON pb.doctor_id = d.id
        LEFT JOIN user_profiles up ON d.doctor_name LIKE CONCAT('%', up.FirstName, '%')
        LEFT JOIN collected_at ca ON pb.collected_at_id = ca.id 
        WHERE pb.sample_id = ?
        LIMIT 1
    `;

    db.query(sql, [sampleId], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: "Database Error" });
        if (results.length === 0) return res.status(404).json({ success: false, error: "No patient found" });

        const data = results[0];

        // 2. Process test summary details
        let processedTests = [];
        if (data.test_summary) {
            data.test_summary.split('|||').forEach(summary => {
                const [name, result, units, rangeJson, comments] = summary.split(':::');
                let refRange = "---";
                try {
                    const parsedRange = JSON.parse(rangeJson);
                    if (parsedRange.length > 0) refRange = parsedRange[0].range;
                } catch(e) { refRange = "---"; }

                processedTests.push({
                    name: name?.trim() || "Unknown Test",
                    result: result || "Pending",
                    units: units || "",
                    range: refRange,
                    comments: comments || ""
                });
            });
        }

        // 3. Handle Signature Image
        let signatureBase64 = "";
        try {
            if (data.SignaturePath) {
                const fullPath = path.join(__dirname, data.SignaturePath.replace(/\\/g, '/'));
                if (fs.existsSync(fullPath)) {
                    const bitmap = fs.readFileSync(fullPath);
                    const ext = path.extname(fullPath).replace('.', '');
                    signatureBase64 = `data:image/${ext};base64,${bitmap.toString('base64')}`;
                }
            }
        } catch (e) { console.error("Signature Error:", e); }

        // 4. Create the EXACT HTML Template
        const htmlTemplate = `
        <html>
            <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; color: #333;">
                ${showHeader ? `
                <div style="border-bottom: 3px solid purple; padding-bottom: 10px; margin-bottom: 20px;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="width: 60%;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="position: relative; width: 40px; height: 40px;">
                                        <div style="position:absolute; left:6px; top:0; width:6px; height:40px; background:#7b1fa2; border-radius:3px;"></div>
                                        <div style="position:absolute; left:10px; top:0px; width:24px; height:24px; border:6px solid #e1bee7; border-radius:50%;"></div>
                                        <div style="position:absolute; width:12px; height:12px; background:#7b1fa2; border-radius:50%; top:12px; left:22px; transform:translate(-50%, -50%);"></div>
                                    </div>
                                    <div>
                                        <h1 style="color: purple; margin: 0; font-size: 28px;">PATHO CONSULT</h1>
                                        <p style="margin: 2px 0; font-weight: bold; color: #555;">Advanced Diagnostic & Research Centre</p>
                                    </div>
                                </div>
                            </td>
                            <td style="text-align: right; font-size: 11px; color: #666;">
                                <p style="margin: 0;">Mylapore, Chennai - 600004</p>
                                <p style="margin: 0;">Phone: 044-24934435</p>
                                <p style="margin: 0;"><strong>ISO 9001:2015 Certified</strong></p>
                            </td>
                        </tr>
                    </table>
                </div>` : '<div style="height: 40px;"></div>'} <div style="background-color: #f9f2ff; padding: 15px; border-radius: 5px; margin-bottom: 25px; border: 1px solid #e0d0f0;">
            <table style="width: 100%; font-size: 13px; line-height: 1.8;">
                <tr>
                    <td style="width: 15%;"><strong>Patient Name</strong></td>
                    <td style="width: 35%;">: ${data.patient_name}</td>
                    <td style="width: 15%;"><strong>Client Code</strong></td>
                    <td style="width: 35%;">: ${data.client_code || 'WALK-IN'}</td>
                </tr>
                <tr>
                    <td><strong>Patient ID</strong></td>
                    <td>: ${data.PatientID}</td>
                    <td><strong>Age / Gender</strong></td>
                    <td>: ${data.Age || 'N/A'} / ${data.Gender || 'N/A'}</td>
                </tr>
                <tr>
                    <td><strong>Sample ID</strong></td>
                    <td>: <span style="color: purple; font-weight: bold;">${data.sample_id}</span></td>
                    <td><strong>Collected At</strong></td>
                    <td>: ${data.collection_center}</td>
                </tr>
                <tr>
                    <td><strong>Registered</strong></td>
                    <td>: ${data.RegDate ? new Date(data.RegDate).toLocaleString() : 'N/A'}</td>
                    <td><strong>Referred By</strong></td>
                    <td>: ${data.doctor_name}</td>
                </tr>
            </table>
        </div>

        <h3 style="text-align: center; text-decoration: underline; color: purple; margin-top: 0;">REPORT OF ANALYSIS</h3>

        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background-color: purple; color: white;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Investigation</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Result</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Units</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Reference Range</th>
                </tr>
            </thead>
            <tbody>
                ${processedTests.map(test => {
                    const isPending = test.result.toLowerCase().includes('pending');
                    return `
                    <tr>
                        <td style="padding: 12px 10px; border-bottom: 1px solid #eee;">
                            <div style="font-weight: bold;">${test.name}</div>
                            ${test.comments ? `<div style="font-size: 10px; color: #777; font-style: italic;">Note: ${test.comments}</div>` : ''}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 15px; font-weight: bold; color: ${isPending ? 'red' : '#000'};">
                            ${test.result}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #666;">${test.units}</td>
                        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-size: 12px;">${test.range}</td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>

        ${data.GeneralLabComments ? `
        <div style="margin-top: 20px; padding: 10px; border: 1px solid #ddd; border-left: 5px solid purple; background: #fafafa;">
            <p style="margin: 0; font-size: 12px; font-weight: bold; color: purple;">Lab Comments:</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; line-height: 1.4;">${data.GeneralLabComments}</p>
        </div>` : ''}

        <div style="margin-top: 60px;">
            <table style="width: 100%;">
                <tr>
                    <td style="width: 60%; font-size: 11px; color: #777; vertical-align: bottom;">
                        <p>*** End of Report ***</p>
                        <p>Note: Results relate only to the sample tested. Clinical correlation is advised.</p>
                    </td>
                    <td style="text-align: center; width: 40%;">
                        ${signatureBase64 ? `<img src="${signatureBase64}" style="max-height: 80px;" />` : `<div style="height: 80px;"></div>`}
                        <div style="border-top: 2px solid purple; padding-top: 5px; margin-top: 5px;">
                            <p style="margin: 0; font-size: 14px; font-weight: bold;"> ${data.doctor_name}</p>
                            <p style="margin: 0; font-size: 12px; color: purple;">${data.PostgraduateDegree || 'Consultant Pathologist'}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    </body>
</html>`;

        // 5. Generate PDF Buffer and Send
        const pdfOptions = { format: 'A4', border: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" } };
        
        pdf.create(htmlTemplate, pdfOptions).toBuffer(async (pdfErr, buffer) => {
            if (pdfErr) return res.status(500).json({ success: false, error: "PDF Generation Error" });

            try {
                await transporter.sendMail({
                    from: '"Patho Consult" <dhanwanthiresathish2005@gmail.com>',
                    to: email,
                    subject: `Final Medical Report - ${data.patient_name} (${sampleId})`,
                    text: `Dear Sir/Madam,\n\nPlease find the attached medical report for Sample ID: ${sampleId}.\n\nRegards,\nPatho Consult Diagnostics`,
                    attachments: [{ filename: `Report_${sampleId}.pdf`, content: buffer }]
                });

                res.json({ success: true, message: `Professional report sent to ${email}` });
            } catch (mailErr) {
                res.status(500).json({ success: false, error: mailErr.message });
            }
        });
    });
});

//62

app.post('/api/add-test', upload.single('testImage'), (req, res) => {
    const d = req.body;

    // 1. Parse JSON strings safely
    let components = [], pregnancyRanges = [], criticalRanges = [], referenceRanges = [];
    try {
        components = typeof d.components === 'string' ? JSON.parse(d.components) : (d.components || []);
        pregnancyRanges = typeof d.pregnancyRanges === 'string' ? JSON.parse(d.pregnancyRanges) : (d.pregnancyRanges || []);
        criticalRanges = typeof d.criticalRanges === 'string' ? JSON.parse(d.criticalRanges) : (d.criticalRanges || []);
        referenceRanges = typeof d.referenceRanges === 'string' ? JSON.parse(d.referenceRanges) : (d.referenceRanges || []);
    } catch (e) {
        console.error("JSON Parsing Error:", e);
    }

    const imagePath = req.file ? req.file.path.replace(/\\/g, '/') : null;

    db.getConnection((err, connection) => {
        if (err) return res.status(500).json({ success: false, error: "DB Connection Failed" });

        // Helper to abort transaction cleanly
        const abort = (msg, specificErr = "") => {
            return connection.rollback(() => {
                connection.release();
                console.error(`${msg}:`, specificErr);
                res.status(500).json({ success: false, error: msg });
            });
        };

        // 2. Fetch Auto-Increment for Test Code
        const getNextIdSql = "SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'myapp_db' AND TABLE_NAME = 'Tests'";
        connection.query(getNextIdSql, (err, data) => {
            if (err) { connection.release(); return res.status(500).json({ success: false }); }

            const nextId = data[0].AUTO_INCREMENT;
            const generatedCode = `TST-${1000 + nextId}`;

            connection.beginTransaction((err) => {
                if (err) { connection.release(); return res.status(500).json({ success: false }); }

                // 3. Insert Main Test Data
                const testSql = `INSERT INTO Tests (
                    measurementType, commonParagraph, culture, alternativeSample, 
                    multipleComponents, calculationPresent, tableRequired, ageWiseCritical, 
                    ageWiseReference, pregnancyReference, biopsyNumber, outsourced, 
                    TestName, TestCode, CultureCategory, Department, SampleContainer, 
                    Methodology, InstrumentReagent, Units, TurnAroundTime, 
                    Price, ValidDate, TestSchedule, CutOffTime, 
                    PatientPreparation, ExpectedResultDate, AdditionalComments, 
                    TestInformation, SelectedProfile
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                const testValues = [
                    d.measurementType, d.commonParagraph, d.culture, d.alternativeSample,
                    d.multipleComponents, d.calculationPresent, d.tableRequired, d.ageWiseCritical,
                    d.ageWiseReference, d.pregnancyReference, d.biopsyNumber, d.outsourced,
                    d.testName, generatedCode, d.cultureCategory, d.department, d.sampleContainer,
                    d.methodology, d.instrumentReagent, d.units, d.turnAroundTime,
                    d.amount || 0, d.validDate || null, d.testSchedule, d.cutOffTime || null,
                    d.patientPreparation, d.expectedResultDate, d.additionalComments,
                    d.testInformation, d.selectedProfile
                ];

                connection.query(testSql, testValues, (err, result) => {
                    if (err) return abort("Main Test Insert Failed", err.sqlMessage);

                    const newTestId = result.insertId;

                    // --- TABLE INSERTION LOGIC ---

                    const savePregnancy = (cb) => {
                        if (String(d.pregnancyReference).toLowerCase() === 'yes' && pregnancyRanges.length > 0) {
                            const sql = `INSERT INTO test_pregnancy_reference (TestID, trimester, lowValue, highValue) VALUES ?`;
                            const vals = pregnancyRanges.map(r => [newTestId, r.trimester, r.lowValue, r.highValue]);
                            connection.query(sql, [vals], (err) => err ? abort("Pregnancy Save Failed", err) : cb());
                        } else cb();
                    };

                    const saveComponents = (cb) => {
                        if (components.length > 0) {
                            const sql = `INSERT INTO test_components (TestID, elementName, unit, methodology, commentType) VALUES ?`;
                            const vals = components.map(c => [newTestId, c.elementName, c.unit, c.methodology, c.commentsType === 'Text' ? 'Free Text' : 'Numeric']);
                            connection.query(sql, [vals], (err) => err ? abort("Component Save Failed", err) : cb());
                        } else cb();
                    };

                    const saveCritical = (cb) => {
                        if (String(d.ageWiseCritical).toLowerCase() === 'yes' && criticalRanges.length > 0) {
                            const sql = `INSERT INTO test_age_critical (TestID, sex, dayStart, dayEnd, yearStart, yearEnd, lowValue, highValue, displayRange) VALUES ?`;
                            const vals = criticalRanges.map(r => [
                                newTestId, r.sex || 'Both', 
                                parseInt(r.dayStart) || 0, parseInt(r.dayEnd) || 0, 
                                parseInt(r.yearStart) || 0, parseInt(r.yearEnd) || 100, 
                                r.lowValue, r.highValue, r.displayRange
                            ]);
                            connection.query(sql, [vals], (err) => err ? abort("Critical Range Save Failed", err) : cb());
                        } else cb();
                    };

                    const saveReference = (cb) => {
                        if (String(d.ageWiseReference).toLowerCase() === 'yes' && referenceRanges.length > 0) {
                            const sql = `INSERT INTO test_age_reference (TestID, sex, dayStart, dayEnd, yearStart, yearEnd, lowValue, highValue, displayRange) VALUES ?`;
                            const vals = referenceRanges.map(r => [
                                newTestId, r.sex || 'Both', 
                                parseInt(r.dayStart) || 0, parseInt(r.dayEnd) || 0, 
                                parseInt(r.yearStart) || 0, parseInt(r.yearEnd) || 100, 
                                r.lowValue, r.highValue, r.displayRange
                            ]);
                            connection.query(sql, [vals], (err) => err ? abort("Reference Range Save Failed", err) : cb());
                        } else cb();
                    };

                    const saveImage = (cb) => {
                        if (imagePath) {
                            const sql = "INSERT INTO test_images (TestID, imagePath) VALUES (?, ?)";
                            connection.query(sql, [newTestId, imagePath], (err) => err ? abort("Image Save Failed", err) : cb());
                        } else cb();
                    };

                    const saveBiopsy = (cb) => {
                if (d.biopsyAbbreviation) {
                    const sql = `INSERT INTO test_biopsy (TestID, abbreviation, description) VALUES (?, ?, ?)`;
                    connection.query(sql, [newTestId, d.biopsyAbbreviation, ''], (err) => {
                        if (err) return abort("Biopsy Save Failed", err.sqlMessage);
                        cb();
                    });
                } else {
                    cb();
                }
            };

            const saveCalculations = (cb) => {
    if (String(d.calculationPresent).toLowerCase() === 'yes' && d.calculations) {
        let calcs = [];
        try {
            calcs = typeof d.calculations === 'string' ? JSON.parse(d.calculations) : d.calculations;
        } catch (e) { 
            console.error("Calc Parse Error", e); 
        }

        if (calcs.length > 0) {
            const sql = `INSERT INTO test_calculations 
                        (TestID, calcType, formula, finalOutput, normalValue, units, parentTestCode) 
                        VALUES ?`;
            
            const vals = calcs.map(c => [
    newTestId,                
    c.calcType || 'Normal',   
    c.formula || '',          
    c.finalOutput || '',      
    c.normalValue || '',      
    c.units || '',            
    c.parentTestCode || ''    
]);

            connection.query(sql, [vals], (err) => {
                if (err) {
                    console.error("SQL Error in Calculations:", err);
                    return abort("Calculation Save Failed", err);
                }
                cb();
            });
        } else cb();
    } else cb();
};

                    // --- EXECUTION CHAIN ---
                    savePregnancy(() => {
                        saveComponents(() => {
                            saveCritical(() => {
                                saveReference(() => {
                                    saveBiopsy(() => {
                                        saveCalculations(() => {
                                        saveImage(() => {
                                            connection.commit((err) => {
                                                if (err) return abort("Commit Failed", err);
                                                    connection.release();
                                                        res.status(200).json({ success: true, testCode: generatedCode, testId: newTestId });
                                        });
                                    });
                                });
                                });
                                });
                            });
                        });
                    });

                }); // End main query
            }); // End transaction
        }); // End nextId query
    }); // End connection
});

//63
app.get('/api/test-by-code/:code', (req, res) => {
    const testCode = req.params.code;
    
    const sql = `
        SELECT 
            t.TestName, 
            t.Units, 
            t.Methodology, 
            tc.formula, 
            tc.calcType
        FROM tests t
        LEFT JOIN test_calculations tc ON t.TestID = tc.TestID
        WHERE t.TestCode = ?
    `;
    
    // REPLACE 'connection' with your actual DB variable name (e.g., db.query)
    db.query(sql, [testCode], (err, results) => { 
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Test not found" });
        }
        
        res.json(results[0]);
    });
});

// 64. REGISTER PROFILE ---
app.post('/api/create-profile', async (req, res) => {
    const { profileName, displayName, amount } = req.body;
    
    try {
        const profileCode = "PR" + Math.floor(1000 + Math.random() * 9000);
        const query = "INSERT INTO profiles (profile_code, profile_name, display_name, amount) VALUES (?, ?, ?, ?)";
        
        // Using .promise() is the key to stopping the error you saw
        await db.promise().query(query, [profileCode, profileName, displayName, amount]);
        
        res.status(200).send({ message: "Profile registered successfully!", code: profileCode });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).send({ error: "Failed to save profile to database." });
    }
});

//65
app.get('/api/get-profiles', (req, res) => {
    // FIX: Added 'priority' to the SELECT statement
    const sql = "SELECT id, profile_code, profile_name, amount, priority FROM profiles ORDER BY id DESC";
    
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).send({ error: "Could not retrieve profiles" });
        }
        res.status(200).json(results);
    });
});

// --- 66. LINK SUB-PROFILE TO PROFILE ---
app.post('/api/link-subprofile', async (req, res) => {
    const { parentId, childId } = req.body;

    try {
        const query = "INSERT INTO profile_subprofile_mapping (parent_profile_id, child_profile_id) VALUES (?, ?)";
        
        await db.promise().query(query, [parentId, childId]);
        
        res.status(200).send({ message: "Sub-profile linked successfully!" });
    } catch (err) {
        console.error("Linking error:", err);
        // Better error message for the user
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).send({ error: "This link already exists!" });
        }
        res.status(500).send({ error: "Database error. Please check server logs." });
    }
});
//67. Search for profiles to add tests to
app.get('/api/search-profiles', (req, res) => {
    const term = `%${req.query.term}%`;
    db.query("SELECT id, profile_name, profile_code FROM profiles WHERE profile_name LIKE ? OR profile_code LIKE ?", [term, term], (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

//68
app.get('/api/get-all-profiles', (req, res) => {
    const sql = "SELECT id, profile_name, profile_code, amount FROM profiles";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err });
        // Wrap the results in a success object
        res.status(200).json({ success: true, data: results });
    });
});
//69
app.put('/api/update-profile/:id', (req, res) => {
    const { id } = req.params;
    const { amount, priority } = req.body;

    let updates = [];
    let params = [];

    // Check if amount is not null and not undefined (allows "0")
    if (amount !== null && amount !== undefined && amount !== "") {
        updates.push("amount = ?");
        params.push(amount);
    }

    // Check if priority is not null and not undefined (allows "0")
    if (priority !== null && priority !== undefined && priority !== "") {
        updates.push("priority = ?");
        params.push(priority);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
    }

    const query = `UPDATE profiles SET ${updates.join(", ")} WHERE id = ?`;
    params.push(id);

    db.query(query, params, (err, result) => {
    if (err) {
        console.error("DB Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
    // Change this to include success: true
    res.json({ success: true, message: "Updated successfully" });
});
});

// 70 Delete Profile
app.delete('/api/delete-profile/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query("DELETE FROM profiles WHERE id = ?", [id]);
        res.status(200).send({ message: "Profile deleted" });
    } catch (err) {
        res.status(500).send(err);
    }
});
//71
app.get('/api/get-profile-details/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Fetch linked Tests with their specific mapping priority
        const testsQuery = `
            SELECT m.mapping_id AS link_id, t.TestID AS test_code, t.TestName AS test_name, m.priority 
            FROM profiletestmapping m
            JOIN tests t ON m.test_id = t.TestID
            WHERE m.profile_id = ?
            ORDER BY m.priority ASC`;

        // Fetch linked Sub-Profiles with their specific mapping priority
       const subProfilesQuery = `
    SELECT m.child_profile_id AS link_id, p.profile_code, p.profile_name, m.priority 
    FROM profile_subprofile_mapping m
    JOIN profiles p ON m.child_profile_id = p.id
    WHERE m.parent_profile_id = ?
    ORDER BY m.priority ASC`;

        const [tests] = await db.promise().query(testsQuery, [id]);
        const [subProfiles] = await db.promise().query(subProfilesQuery, [id]);

        res.json({ tests, subProfiles });
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).send({ error: "Check if priority/id columns exist in mapping tables." });
    }
});
// 72Server.js - Update this section
app.put('/api/update-link-priority', async (req, res) => {
    const { linkId, priority, type, parentId } = req.body;
    
    try {
        if (type === 'test') {
            const query = `UPDATE profiletestmapping SET priority = ? WHERE mapping_id = ?`;
            await db.promise().query(query, [priority, linkId]);
        } else {
            // FIX: Ensure this query matches your table structure
            const query = `UPDATE profile_subprofile_mapping SET priority = ? 
                           WHERE parent_profile_id = ? AND child_profile_id = ?`;
            await db.promise().query(query, [priority, parentId, linkId]);
        }
        res.status(200).send({ message: "Updated" });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
});
//73
app.post('/api/link-test-to-profile', async (req, res) => {
    const { profileId, testId } = req.body;
    try {
        const query = "INSERT INTO profiletestmapping (profile_id, test_id, priority) VALUES (?, ?, 0)";
        await db.promise().query(query, [profileId, testId]);
        res.status(200).send({ message: "Test linked successfully!" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ error: "Test already in profile!" });
        res.status(500).send(err);
    }
});
//74
app.get('/api/test-elements', (req, res) => {
    // JOIN TestElements with Tests to get the parent metadata
    const sql = `
        SELECT 
            te.ElementID, 
            te.ElementName, 
            te.TestCode as ElementCode, 
            te.Priority, 
            t.TestName as ParentName, 
            t.CultureCategory as ParentCategory, 
            t.multipleComponents
        FROM TestElements te
        JOIN Tests t ON te.ParentTestID = t.TestID
        ORDER BY te.Priority ASC, te.ElementID DESC`;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json({ message: "Database fetch failed" });
        }

        const responseData = results.map(el => ({
            id: el.ElementID, 
            element_name: el.ElementName,
            test_code: el.ElementCode || el.ParentCategory || `TID-${el.ElementID}`,
            test_name: el.ParentName, // This populates the "Test Name" display in your teal boxes
            existing_priority: el.Priority || 0,
            priority: el.Priority || 0,
            // Logic to separate into Multiple vs Single boxes
            category: el.multipleComponents === 'Yes' ? 'multiple' : 'single'
        }));
        
        res.status(200).json(responseData);
    });
});

//75
app.post('/api/elements/add', (req, res) => {
    const { parentTestId, code, elementName } = req.body;

    const sql = `INSERT INTO TestElements (ParentTestID, ElementName, TestCode, IsActive) VALUES (?, ?, ?, ?)`;
    
    db.query(sql, [parentTestId, elementName, code, 1], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.sqlMessage });

        // Check how many elements this test now has
        const countSql = "SELECT COUNT(*) as count FROM TestElements WHERE ParentTestID = ?";
        db.query(countSql, [parentTestId], (err, countResult) => {
            const count = countResult[0].count;
            // If more than 1 element, mark as Multiple
            const status = count > 1 ? 'Yes' : 'No'; 
            
            const updateParentSql = "UPDATE Tests SET multipleComponents = ? WHERE TestID = ?";
            db.query(updateParentSql, [status, parentTestId], () => {
                res.status(201).json({ success: true, message: "Saved successfully!" });
            });
        });
    });
});

//76
app.delete('/api/delete-test/:id', async (req, res) => {
    const billingId = req.params.id; // This is '311' from your screenshot
    
    try {
        // 1. First, check if the record exists in the billing table
        const [record] = await db.promise().query(
            "SELECT id FROM patient_billing_details WHERE id = ?", 
            [billingId]
        );

        if (record.length === 0) {
            return res.status(404).json({ success: false, message: "Billing record not found" });
        }

        // 2. Perform the deletion
        await db.promise().query(
            "DELETE FROM patient_billing_details WHERE id = ?", 
            [billingId]
        );

        res.status(200).json({ 
            success: true, 
            message: "Test removed from billing successfully" 
        });

    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ success: false, error: "Database error" });
    }
});

//77

app.get('/api/parent-tests', (req, res) => {
    // Added TestCode to the SELECT statement
    const sql = "SELECT TestID, TestName, TestCode FROM tests ORDER BY TestName ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

//78
app.put('/api/elements/update-priority/:id', (req, res) => {
    let elementId = req.params.id;
    if (elementId.includes(':')) {
        elementId = elementId.split(':')[0];
    }

    const priority = parseInt(req.body.priority);

    // FIX: Changed 'id' to 'ElementID' to match your table schema
    const sql = "UPDATE TestElements SET Priority = ? WHERE ElementID = ?";
    
    db.query(sql, [priority, elementId], (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ success: false, message: "Database error: " + err.sqlMessage });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Element not found" });
        }

        res.json({ success: true, message: "Updated!" });
    });
});

//79. editratecard

app.post('/api/rates/update', (req, res) => {
    // These come from your EditRateCard.js formData
    const { profileName, amount, endDate, email, phone } = req.body;

    // 1. Update the 'profiles' table (Targeting your MariaDB schema)
    // We use profile_name to find the record and update the amount column
    const updateProfileSql = "UPDATE profiles SET amount = ? WHERE profile_name = ?";
    
    db.query(updateProfileSql, [amount, profileName], (err, result) => {
        if (err) {
            console.error("Profile Update Error:", err);
            return res.status(500).json({ success: false, error: "Failed to update profile amount" });
        }

        // 2. Insert or Update the 'rates' history table
        // This keeps a log of WHO changed the rate and the expiry (EndDate)
        const updateRatesSql = `
            INSERT INTO rates (ProfileName, Rate, EndDate, CreatorEmail, CreatorPhone) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            Rate = VALUES(Rate), 
            EndDate = VALUES(EndDate), 
            CreatorEmail = VALUES(CreatorEmail), 
            CreatorPhone = VALUES(CreatorPhone)`;

        db.query(updateRatesSql, [profileName, amount, endDate, email, phone], (err2, result2) => {
            if (err2) {
                console.error("Rates Table Error:", err2);
                return res.status(500).json({ success: false, error: "Profile updated, but rate log failed." });
            }
            
            res.status(200).json({ success: true, message: "Profile rate and history log updated!" });
        });
    });
});

//80

app.get('/api/get-profile-rates', (req, res) => {
    const sql = "SELECT id, profile_code, profile_name, amount FROM profiles ORDER BY profile_name ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results); 
    });
});

//81 --- LAB VIEW DATA FETCHING ---
app.get('/api/lab-view-data', (req, res) => {
    let { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
        const today = new Date();
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        fromDate = lastWeek.toISOString().split('T')[0];
        toDate = today.toISOString().split('T')[0];
    }

const sql = `
        SELECT 
            p.patient_name, 
            p.PatientID AS patient_id, 
            p.external_id, 
            COALESCE(MAX(ca.name), MAX(b.location_code), 'Main Center') AS collected_at,
            COALESCE(MAX(b.client_code), p.client_code) AS client_code, 
            COALESCE(MAX(b.sample_id), p.sample_id) AS sample_id,
            
            CASE 
                WHEN COUNT(b.id) = 0 THEN 'No Tests'
                WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(b.id) THEN 'Completed'
                WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) > 0 THEN 'In Progress'
                ELSE 'Pending'
            END AS lab_status,

            -- FIX: test_billed counts distinct test records
            COUNT(DISTINCT b.id) AS test_billed,

            -- FIX: test_saved now counts all billed tests to match 'test_billed'
            -- This ensures the column shows the total billed count as requested.
            COUNT(b.id) AS test_saved,

            -- Keeps track of finalized tests
            SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) AS confirmed_test,
            SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) AS approved_test,
            (COUNT(DISTINCT b.id) - SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END)) AS test_pending_approval,

            CASE 
                WHEN SUM(IFNULL(b.balance, 0)) > 0 THEN 'Unpaid'
                WHEN COUNT(b.id) > 0 THEN 'Paid' 
                ELSE 'N/A'
            END AS status,

            DATE_FORMAT(p.RegDate, '%d-%m-%Y') AS create_date,
            IF(SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(b.id) AND COUNT(b.id) > 0, 'Yes', 'No') AS test_completed
            
        FROM patients p
        LEFT JOIN patient_billing_details b ON p.PatientID = b.PatientID
        LEFT JOIN collected_at ca ON b.collected_at_id = ca.id 
        WHERE p.RegDate BETWEEN ? AND ?
        GROUP BY p.PatientID 
        ORDER BY p.RegDate DESC
    `;

    const params = [`${fromDate} 00:00:00`, `${toDate} 23:59:59`];

    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Lab View Database Error:", err);
            return res.status(500).json({ success: false, message: "Database query failed." });
        }
        res.json({ success: true, data: results });
    });
});

//82
app.get('/api/sample-details/:sampleId', (req, res) => {
    const { sampleId } = req.params;

    const sql = `
    SELECT 
        p.patient_name, p.PatientID AS patient_id, p.age, p.gender, p.external_id,
        COALESCE(b.client_code, p.client_code) AS client_code,
        DATE_FORMAT(b.bill_date, '%d-%m-%Y %H:%i') AS registration_date,
        b.id AS billing_id, b.sample_id, b.Status AS test_status, b.ResultValue, b.LabComments,
        -- Get the specific name for the individual test in this row
        t.TestName AS test_display_name,
        COALESCE(d.doctor_name, 'Self') AS referredBy,
        tem.unit AS element_unit,
        CONCAT(COALESCE(tem.lower_limit, ''), '-', COALESCE(tem.upper_limit, '')) AS element_range,
        tt.test_content
    FROM patient_billing_details b
    INNER JOIN patients p ON b.PatientID = p.PatientID
    LEFT JOIN doctor_details d ON b.doctor_id = d.id
    LEFT JOIN tests t ON b.TestID = t.TestID 
    -- We join templates directly to the TestID in the billing row
    LEFT JOIN test_element_templates tem ON b.TestID = tem.element_id
    LEFT JOIN test_templates tt ON b.TestID = tt.test_id
    WHERE b.sample_id = ?
    ORDER BY b.id ASC;
`;

    db.query(sql, [sampleId], (err, results) => {
        // IMPORTANT: Use return to stop execution after sending a response
        if (err) {
            console.error("DB Error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        
        if (!results || results.length === 0) {
            return res.status(404).json({ success: false, message: "No records found" });
        }

        try {
            const tests = results.map(row => {
                let normalRange = (row.element_range && row.element_range !== '-' && row.element_range !== '--') ? row.element_range : "-";
                let units = row.element_unit || "N/A";

                if ((normalRange === "-" || units === "N/A") && row.test_content) {
                    try {
                        const content = typeof row.test_content === 'string' ? JSON.parse(row.test_content) : row.test_content;
                        if (Array.isArray(content) && content.length > 0) {
                            normalRange = content[0].range || content[0].reference_range || normalRange;
                            units = content[0].unit || units;
                        }
                    } catch (e) { 
                        // Just log, don't crash
                    }
                }

                return {
                    billing_id: row.billing_id,
                    test_name: row.test_display_name || "Undefined Test",
                    status: row.test_status || "Pending",
                    ResultValue: row.ResultValue || "-", 
                    LabComments: row.LabComments || "",
                    normal_range: normalRange,
                    Units: units.trim()
                };
            });

            const patientData = {
                patient_name: results[0].patient_name,
                patient_id: results[0].patient_id,
                age: results[0].age,
                gender: results[0].gender,
                external_id: results[0].external_id,
                client_code: results[0].client_code || "N/A", 
                registration_date: results[0].registration_date,
                sample_id: results[0].sample_id,
                referredBy: results[0].referredBy,
                tests: tests
            };

            // Final response - ensure this is only called ONCE
            return res.json({ success: true, data: patientData });

        } catch (processErr) {
            console.error("Processing Error:", processErr);
            return res.status(500).json({ success: false, message: "Error processing data" });
        }
    });
});


//83
app.post('/api/approve-all-tests/:sampleId', (req, res) => {
    const { sampleId } = req.params;

    // Update all tests for this sample to 'Approved'
    const sql = "UPDATE patient_billing_details SET Status = 'Approved' WHERE sample_id = ?";

    db.query(sql, [sampleId], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, message: "Failed to update records" });
        }
        
        res.json({ 
            success: true, 
            message: `Successfully approved ${result.affectedRows} tests.` 
        });
    });
});

//84
app.get('/api/get-tests', (req, res) => {
    // We JOIN the tests with their elements so the frontend gets the ElementID
    const sql = `
        SELECT 
            t.TestID, 
            t.TestName, 
            t.TestCode, 
            e.ElementID, 
            e.ElementName 
        FROM tests t
        INNER JOIN testelements e ON t.TestID = e.ParentTestID
        ORDER BY t.TestName ASC
    `; 
    
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });

        res.json({ 
            success: true, 
            data: results 
        });
    });
});

//85
app.get('/api/tests', async (req, res) => {
    // Select the key columns needed for billing and collection
    const sql = `
        SELECT 
            TestID, 
            TestName, 
            TestCode, 
            Price, 
            Department, 
            SampleContainer, 
            Methodology,
            Units,
            TurnAroundTime,
            IsActive
        FROM tests 
        WHERE IsActive = 1
        ORDER BY TestName ASC
    `;

    try {
        // Using .promise() to handle the async/await correctly
        const [rows] = await db.promise().query(sql);
        
        res.json({ 
            success: true, 
            count: rows.length,
            data: rows 
        });
    } catch (err) {
        console.error("Error fetching tests:", err);
        res.status(500).json({ 
            success: false, 
            error: "Failed to fetch test master list" 
        });
    }
});

//86
app.post('/api/save-test-template', (req, res) => {
    const { elementId, ranges } = req.body; 
    console.log("Received Payload:", req.body);

    if (!elementId || !ranges || !ranges.length) {
        return res.status(400).json({ 
            success: false, 
            message: `Missing data. Received elementId: ${elementId}` 
        });
    }
    const values = ranges.map(r => [
        elementId, 
        r.template_name || 'General', 
        r.lower_limit || null, 
        r.upper_limit || null, 
        r.unit || ''
    ]);

    const sql = `INSERT INTO test_element_templates 
                 (element_id, template_name, lower_limit, upper_limit, unit) 
                 VALUES ?`;

    db.query(sql, [values], (err, result) => {
        if (err) {
            console.error("Database Error:", err.sqlMessage);
            return res.status(500).json({ success: false, error: err.sqlMessage });
        }
        res.json({ success: true, message: "Template saved!" });
    });
});

//87
app.get('/api/tests/active', (req, res) => {
    const sql = `
        SELECT 
             TestID AS id,
            TestName,
            TestCode,
            Price,
            Department,
            IsActive 
        FROM tests 
        WHERE IsActive = 1 
        ORDER BY TestName ASC
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, data: results });
    });
});


//88
app.get('/api/tests/disabled', (req, res) => {

    const sql = `
        SELECT 
            TestID AS id,
            TestName,
            TestCode,
            Price,
            Department,
            IsActive
        FROM tests
        WHERE IsActive = 0
        ORDER BY TestName ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success:false,
                error:err.message
            });
        }

        res.json({
            success:true,
            data:results
        });
    });
});

//89
app.get('/api/get-test-elements/:testId', (req, res) => {
    const { testId } = req.params;
    // We filter by ParentTestID which connects to the Test table
    const sql = "SELECT ElementID, ElementName FROM testelements WHERE ParentTestID = ? AND IsActive = 1";
    
    db.query(sql, [testId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: results });
    });
});

//90
app.get('/api/inventory/full-list', (req, res) => {
    const sql = `
        SELECT 
            TestID, 
            TestID AS id, 
            TestName, 
            TestCode, 
            Department, 
            IFNULL(Price, 0) AS Price, 
            TestSchedule, 
            TurnAroundTime, 
            DATE_FORMAT(CutOffTime, '%H:%i') AS CutOffTime, 
            IsActive 
        FROM tests 
        ORDER BY TestName ASC`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

//91
app.get('/api/inventory/status-list', (req, res) => {
    const sql = `
        SELECT 
            TestID, 
            TestID AS id, 
            TestName, 
            TestCode, 
            Department,
            IsActive 
        FROM tests 
        ORDER BY TestID DESC`; 

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, data: results });
    });
});

// 92. FOR EDIT FORM (Single Test Details)
app.get('/api/inventory/test/:id', (req, res) => {
    const { id } = req.params;
    // Fetches all 34 columns for the specific edit form
    const sql = "SELECT * FROM tests WHERE TestID = ?";

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (results.length === 0) return res.status(404).json({ success: false, message: "Not found" });
        res.json({ success: true, data: results[0] });
    });
});

// 93.Toggle Test Status
app.put('/api/tests/toggle-status/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // status will be 0 or 1
    const sql = "UPDATE tests SET IsActive = ? WHERE TestID = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ success: true, message: "Status updated" });
    });
});

//94
app.get('/api/get-all-tests', (req, res) => {

    const sql = `
        SELECT 
            TestID AS id,   -- ⭐ VERY IMPORTANT for DataGrid
            TestName,
            TestCode,
            Price,
            Department,
            IsActive
        FROM tests
        ORDER BY TestName ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success:false,
                error:err.message
            });
        }

        res.json({
            success:true,
            data:results
        });
    });
});



// 95.In your server.js / index.js
app.put('/api/update-test/:id', (req, res) => {
    const { id } = req.params;
    const { TestName, TestCode, Price, Department, TurnAroundTime, CutOffTime, TestSchedule } = req.body;

    const sql = `
        UPDATE tests 
        SET TestName = ?, TestCode = ?, Price = ?, Department = ?, 
            TurnAroundTime = ?, CutOffTime = ?, TestSchedule = ? 
        WHERE TestID = ?
    `;

    const values = [TestName, TestCode, Price, Department, TurnAroundTime, CutOffTime, TestSchedule, id];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ success: false, error: err });
        }
        res.status(200).json({ success: true, message: "Update successful" });
    });
});

// 96. Fetch all departments
app.get('/api/get-departments', (req, res) => {
    const sql = "SELECT DepartmentID, DepartmentName,Priority FROM departments ORDER BY DepartmentID DESC";
    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err });
        }
        res.status(200).json({ success: true, data: result });
    });
});

// 97. Add a new department
app.post('/api/add-department', (req, res) => {
    const { name } = req.body;
    const sql = "INSERT INTO departments (DepartmentName) VALUES (?)";
    db.query(sql, [name], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: err });
        }
        res.status(200).json({ success: true, message: "Department added!" });
    });
});

// 98. Ensure the path is exactly /api/delete-department
app.delete('/api/delete-department/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM departments WHERE DepartmentID = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, message: "Deleted successfully" });
    });
});

//99. Update Department Priorities
app.post('/api/update-dept-priority', (req, res) => {
    const { priorities } = req.body; // Expecting an array of { id, priority }

    if (!priorities || !Array.isArray(priorities)) {
        return res.status(400).json({ success: false, message: "Invalid data format" });
    }

    // We use a Promise.all to ensure all updates complete
    const updatePromises = priorities.map(item => {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE departments SET Priority = ? WHERE DepartmentID = ?";
            db.query(sql, [item.priority, item.id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(updatePromises)
        .then(() => res.json({ success: true, message: "All priorities updated successfully!" }))
        .catch(err => {
            console.error(err);
            res.status(500).json({ success: false, error: err.message });
        });
});
// 100. Get tests filtered by Department
app.get('/api/get-tests-by-dept/:deptId', (req, res) => {
    const { deptId } = req.params;
    const sql = "SELECT TestID, TestName, TestCode, Priority FROM tests WHERE DepartmentID = ? ORDER BY TestName ASC";
    
    db.query(sql, [deptId], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, data: result });
    });
});

// 101. Bulk Update Test Priorities
app.post('/api/update-test-priority', (req, res) => {
    const { priorities } = req.body; 
    const updatePromises = priorities.map(item => {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE tests SET Priority = ? WHERE TestID = ?";
            db.query(sql, [item.priority, item.id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(updatePromises)
        .then(() => res.json({ success: true, message: "Test priorities updated!" }))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
});
// 102. Get unique categories for the dropdown
app.get('/api/get-test-categories', (req, res) => {
    const sql = "SELECT DISTINCT CultureCategory FROM tests WHERE CultureCategory IS NOT NULL ORDER BY CultureCategory ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: result });
    });
});

//103
app.get('/api/get-tests-by-category', (req, res) => {
    const { category } = req.query; // This 'category' variable comes from your frontend request
    
    // Changed 'Category = ?' to 'CultureCategory = ?'
    const sql = "SELECT TestID, TestName, TestCode, Priority FROM tests WHERE CultureCategory = ? ORDER BY TestName ASC";
    
    db.query(sql, [category], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, data: result });
    });
});

// 104. Bulk Update Priorities
app.post('/api/update-test-priority', (req, res) => {
    const { priorities } = req.body; // Array of {id, priority}
    
    const queries = priorities.map(item => {
        return new Promise((resolve, reject) => {
            const sql = "UPDATE tests SET Priority = ? WHERE TestID = ?";
            db.query(sql, [item.priority, item.id], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    });

    Promise.all(queries)
        .then(() => res.json({ success: true }))
        .catch(err => res.status(500).json({ success: false, error: err.message }));
});

// 105Fetch tests using the Department Name string
app.get('/api/get-tests-by-dept-name/:deptName', (req, res) => {
    const { deptName } = req.params;
    const sql = "SELECT TestID, TestName, TestCode, Priority FROM tests WHERE Department = ? ORDER BY TestName ASC";
    
    db.query(sql, [deptName], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, data: result });
    });
});
// 106. GET template by Test ID
app.get('/api/get-template/:testId', (req, res) => {
    const { testId } = req.params;
    const sql = "SELECT * FROM test_templates WHERE test_id = ?";
    
    db.query(sql, [testId], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        // Return the first match or null if not found
        res.status(200).json({ 
            success: true, 
            data: result.length > 0 ? result[0] : null 
        });
    });
});

//107
app.post('/api/save-template', (req, res) => {
    const { testId, templateName, content } = req.body;

    // Use REPLACE INTO to update if it exists, or insert if it's new
    const sql = `INSERT INTO test_templates (test_id, template_name, test_content) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE test_content = VALUES(test_content)`;

    db.query(sql, [testId, templateName, content], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "Template saved successfully!" });
    });
});

//108
app.post('/api/save-isolated-organ', (req, res) => {
    const { organismName, cultureCategory } = req.body;
    const sql = "INSERT INTO isolated_organs (organism_name, culture_category) VALUES (?, ?)";
    
    db.query(sql, [organismName, cultureCategory], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database Error" });
        }
        res.status(200).json({ success: true, message: "Organism saved successfully!" });
    });
});

//109
app.get('/api/get-isolated-organs', (req, res) => {
    const sql = "SELECT id, organism_name AS OrganismName, culture_category AS CultureCategory FROM isolated_organs ORDER BY organism_name ASC";
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database Error" });
        }
        res.status(200).json({ success: true, data: result });
    });
});
//110.  DELETE: Remove an organism
app.delete('/api/delete-isolated-organ/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM isolated_organs WHERE id = ?";
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "Deleted successfully" });
    });
});

//111
app.put('/api/edit-isolated-organ/:id', (req, res) => {
    const { id } = req.params;
    const { organismName, cultureCategory } = req.body;

    // Update both fields in MariaDB
    const sql = `
        UPDATE isolated_organs 
        SET organism_name = ?, culture_category = ? 
        WHERE id = ?
    `;
    
    db.query(sql, [organismName, cultureCategory, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "Record updated successfully" });
    });
});

//112 GET: Fetch all microbial agents
app.get('/api/get-microbial-agents', (req, res) => {
    const sql = "SELECT id, agent_name AS AgentName, culture_category AS CultureCategory FROM microbial_agents ORDER BY agent_name ASC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, data: result });
    });
});

// 113POST: Save a new microbial agent
app.post('/api/save-microbial-agent', (req, res) => {
    const { agentName, cultureCategory } = req.body;
    const sql = "INSERT INTO microbial_agents (agent_name, culture_category) VALUES (?, ?)";
    db.query(sql, [agentName, cultureCategory], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.status(200).json({ success: true, message: "Agent saved successfully!" });
    });
});

//114 DELETE: Remove a microbial agent
app.delete('/api/delete-microbial-agent/:id', (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM microbial_agents WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "Agent deleted successfully" });
    });
});

//115 PUT: Edit a microbial agent
app.put('/api/edit-microbial-agent/:id', (req, res) => {
    const { id } = req.params;
    const { agentName, cultureCategory } = req.body;
    const sql = "UPDATE microbial_agents SET agent_name = ?, culture_category = ? WHERE id = ?";
    db.query(sql, [agentName, cultureCategory, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "Agent updated successfully" });
    });
});
//116 server.js or routes/invoices.js

app.get('/api/invoices', (req, res) => {
    const { from, to, type, clientId, status, patientId } = req.query;

let sqlQuery = `
        SELECT 
            pb.id AS id, 
            pb.invoice_no AS invoiceNo, 
            DATE_FORMAT(p.RegDate, '%d-%m-%Y') AS date, 
            COALESCE(pb.sample_id, p.sample_id, 'N/A') AS sampleId, 
            p.PatientID AS patientId, 
            p.patient_name AS patientName, 
            meta.totalBillAmount AS totalAmount, 
            -- FIX 1: Use the summed paid amount from our 'meta' join
            meta.totalPaidAmount AS paidAmount, 
            IFNULL(pb.discount_amount, 0) AS discount_amount, 
            -- FIX 2: Correct balance math using the total paid amount
            (meta.totalBillAmount - meta.totalPaidAmount - IFNULL(pb.discount_amount, 0)) AS balance, 
            pb.notes AS notes,
            DATE_FORMAT(pb.payment_date, '%d-%m-%Y') AS paymentDate,
            pb.billing_type AS invoiceType,
            pb.payment_modes AS paymentType,
            -- FIX 3: Status now reflects the total invoice balance
            CASE 
                WHEN (meta.totalBillAmount - meta.totalPaidAmount - IFNULL(pb.discount_amount, 0)) <= 0 THEN 'Approved' 
                ELSE 'Pending' 
            END AS invoiceStatus,
            COALESCE(ca.name, 'Main Center') AS collectedAt, 
            pb.client_code AS clientCode,
            COALESCE(d.doctor_name, 'Self') AS referredBy,
            pb.group_name AS groupName,
            (
                SELECT GROUP_CONCAT(
                    CONCAT(
                        COALESCE(NULLIF(t.TestID, 0), t.profile_id, 'N/A'), 
                        ':::', 
                        COALESCE(
                            tm.TestName, 
                            prof.profile_name, 
                            NULLIF(t.test_names, ''),
                            NULLIF(t.group_name, ''),
                            'Unknown Item'
                        ), 
                        ':::', 
                        t.Amount
                    )
                    SEPARATOR '|||'
                )
                FROM patient_billing_details t
                LEFT JOIN tests tm ON t.TestID = tm.TestID 
                LEFT JOIN profiles prof ON t.profile_id = prof.id 
                WHERE t.invoice_no = pb.invoice_no
            ) AS test_summary
        FROM patient_billing_details pb
        INNER JOIN (
            SELECT 
                invoice_no, 
                MAX(id) as max_id, 
                SUM(Amount) as totalBillAmount,
                SUM(amount_paid) as totalPaidAmount 
            FROM patient_billing_details 
            GROUP BY invoice_no
        ) meta ON pb.id = meta.max_id
        LEFT JOIN patients p ON pb.PatientID = p.PatientID
        LEFT JOIN doctor_details d ON pb.doctor_id = d.id
        LEFT JOIN collected_at ca ON pb.collected_at_id = ca.id 
        WHERE 1=1
    `;

    let queryParams = [];

    if (from && to) {
        sqlQuery += " AND p.RegDate BETWEEN ? AND ?";
        queryParams.push(from, to);
    }

    if (type && type !== 'All') {
        sqlQuery += " AND LOWER(pb.billing_type) = LOWER(?)";
        queryParams.push(type);
    }

    if (patientId) {
        sqlQuery += " AND p.PatientID = ?";
        queryParams.push(patientId);
    }

    if (clientId) {
        if (clientId === 'self') {
            sqlQuery += " AND (pb.collected_at_id IS NULL OR pb.collected_at_id = 0)";
        } else {
            sqlQuery += " AND pb.collected_at_id = ?";
            queryParams.push(clientId);
        }
    }

    if (status && status !== 'All') {
        // Use the calculated balance logic for filtering
        if (status === 'Approved' || status === 'Paid') {
            sqlQuery += " AND (meta.totalBillAmount - pb.amount_paid - IFNULL(pb.discount_amount, 0)) <= 0";
        } else if (status === 'Pending' || status === 'Due') {
            sqlQuery += " AND (meta.totalBillAmount - pb.amount_paid - IFNULL(pb.discount_amount, 0)) > 0";
        }
    }

    sqlQuery += " GROUP BY pb.invoice_no ORDER BY pb.id DESC";

    db.query(sqlQuery, queryParams, (err, results) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json({ error: err.message });
        }

        const formattedResults = results.map(row => {
    let tests = [];
    if (row.test_summary) {
        row.test_summary.split('|||').forEach(item => {
            const parts = item.split(':::');
            const code = parts[0] !== 'N/A' ? parts[0] : 'GRP-' + row.id;
            const description = parts[1] || 'Unknown Item';
            const amount = parseFloat(parts[2] || 0);

            if (description.includes(',')) {
                const subTests = description.split(',');
                subTests.forEach(testName => {
                    tests.push({
                        code: code,
                        description: testName.trim(),
                        amount: amount / subTests.length
                    });
                });
            } else {
                tests.push({ code, description, amount });
            }
        });
    }
    
    // Convert strings to numbers for formatting
    const total = parseFloat(row.totalAmount || 0);
    const paid = parseFloat(row.paidAmount || 0);
    const discount = parseFloat(row.discount_amount || 0);

    return { 
        ...row, 
        tests,
        totalAmount: total.toFixed(2),
        paidAmount: paid.toFixed(2),
        discount_amount: discount.toFixed(2),
        
        // THE FIX: Do not calculate balance here. Use the 'balance' field 
        // already calculated by your SQL query alias (row.balance).
        balance: parseFloat(row.balance || 0).toFixed(2)
    };
});

        res.json(formattedResults);
    });
});

//117
app.put('/api/invoices/:id', (req, res) => {
    const { patient_name, clientCode, collectedAt, referredBy, discount_amount } = req.body;
    const { id } = req.params;
    
    const doctorQuery = referredBy === 'Self' ? "NULL" : "(SELECT id FROM doctor_details WHERE TRIM(doctor_name) = ? LIMIT 1)";
    const collectedQuery = collectedAt === 'Main Center' ? "NULL" : "(SELECT id FROM collected_at WHERE TRIM(name) = ? LIMIT 1)";

    const sql = `
        UPDATE patient_billing_details pb
        JOIN patients p ON pb.PatientID = p.PatientID
        SET 
            p.patient_name = ?, 
            pb.client_code = ?, 
            pb.discount_amount = IFNULL(?, 0),
            pb.collected_at_id = ${collectedQuery}, 
            pb.doctor_id = ${doctorQuery}
        WHERE pb.id = ?`;

    const params = [patient_name, clientCode, discount_amount];
    if (collectedAt !== 'Main Center') params.push(collectedAt);
    if (referredBy !== 'Self') params.push(referredBy);
    params.push(id);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Invoice updated successfully" });
    });
});
//118
app.patch('/api/invoices/:id/discount', (req, res) => {
    const { id } = req.params;
    const { discountPercentage } = req.body; 

    if (discountPercentage === undefined) {
        return res.status(400).json({ error: "Discount percentage is required" });
    }

    // 1. Fetch current billing details to calculate absolute discount value
    const fetchSql = "SELECT Amount, amount_paid FROM patient_billing_details WHERE id = ?";
    
    db.query(fetchSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Invoice record not found" });

        const totalAmount = parseFloat(results[0].Amount) || 0;
        const paidAmount = parseFloat(results[0].amount_paid) || 0;
        
        // 2. Calculate actual discount amount from percentage
        const discValue = (totalAmount * parseFloat(discountPercentage)) / 100;
        
        // 3. Update the record
        // Note: Your GET query uses (meta.totalBillAmount - pb.amount_paid - pb.discount_amount)
        // so we must update discount_amount.
        const updateSql = `
            UPDATE patient_billing_details 
            SET discount_amount = ?
            WHERE id = ?`;

        db.query(updateSql, [discValue, id], (err, result) => {
            if (err) {
                console.error("Update Error:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ 
                message: "Discount applied successfully", 
                appliedAmount: discValue.toFixed(2) 
            });
        });
    });
});

//119
app.patch('/api/invoices/:id/remove-discount', (req, res) => {
    const { id } = req.params;

    const sql = `
        UPDATE patient_billing_details 
        SET discount_amount = 0, 
            discount_percent = 0
        WHERE id = ?`;
    
    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json({ success: true, message: "All discounts removed" });
    });
});

// 120C. Save Notes (Notes Modal)
app.patch('/api/invoices/:id/notes', (req, res) => {
    const { notes } = req.body;
    const { id } = req.params; 
    // 1. First, find the invoice_no associated with this specific row ID
    const findInvoiceSql = "SELECT invoice_no FROM patient_billing_details WHERE id = ?";
    
    db.query(findInvoiceSql, [id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ error: "Invoice not found" });
        }

        const invoiceNo = results[0].invoice_no;
        const timestamp = new Date().toLocaleString('en-IN');
        const formattedNote = `\n[${timestamp}]: ${notes}`;
        const updateSql = `
            UPDATE patient_billing_details 
            SET notes = CONCAT(IFNULL(notes, ''), ?) 
            WHERE invoice_no = ?`;

        db.query(updateSql, [formattedNote, invoiceNo], (err, result) => {
            if (err) {
                console.error("Note Save Error:", err);
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Notes updated across all invoice records" });
        });
    });
});

//121
app.post('/api/record-payment', (req, res) => {
    const { id, amountPaid, paymentMode } = req.body;

    // We only update financial columns. 
    // We REMOVED the "Status = CASE..." logic to keep it independent 
    // from the Approver Screen.
    const sql = `
        UPDATE patient_billing_details 
        SET 
            balance = balance - ?, 
            amount_paid = amount_paid + ?, 
            payment_modes = ?, 
            payment_date = NOW()
        WHERE id = ?`;

    // Only 4 parameters needed now
    db.query(sql, [amountPaid, amountPaid, paymentMode, id], (err, result) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                error: `Record ID ${id} not found.` 
            });
        }

        res.json({ 
            success: true, 
            message: `Payment of ${amountPaid} recorded. Medical status remains unchanged.` 
        });
    });
});

//122
app.post('/api/register-group', (req, res) => {
    // Added hospital_name, referred_by, and profile_test to the destructuring
    const { 
        group_name, 
        group_amount, 
        total_persons, 
        client_code, 
        hospital_name, 
        referred_by, 
        profile_test 
    } = req.body;

    const sql = `
        INSERT INTO groups 
        (GroupName, TotalAmount, NumPersons, ClientCode, HospitalName, ReferredBy, ProfileTest, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')
    `;
    
    const params = [
    group_name, 
    group_amount, 
    total_persons, 
    client_code, 
    hospital_name || null, 
    referred_by || null, 
    // Join the array into a string if it's not already a string
    Array.isArray(profile_test) ? profile_test.join(', ') : (profile_test || null)
];
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("Group Reg Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, groupId: result.insertId }); 
    });
});
//123
app.get('/api/get-groups', (req, res) => {
    const sql = `
        
SELECT 
    g.GroupID, 
    g.GroupName, 
    g.TotalAmount, 
    g.NumPersons AS Quota, 
    g.ClientCode,
    g.ProfileTest,
    g.collected_at_id, -- <--- ADD THIS so the patient gets the right location
    COUNT(p.PatientID) AS RegisteredCount
FROM groups g
LEFT JOIN patients p ON g.GroupID = p.GroupID
GROUP BY g.GroupID, g.GroupName, g.TotalAmount, g.NumPersons, g.ClientCode, g.ProfileTest, g.collected_at_id
ORDER BY g.GroupID DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});
// 124Add this to your server.js
app.get('/api/get-group-count/:groupId', (req, res) => {
    const { groupId } = req.params;
    const query = 'SELECT COUNT(*) as count FROM patients WHERE GroupID = ?';
    
    db.query(query, [groupId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json({ count: results[0].count });
    });
});
//125
app.get('/api/search-patients', (req, res) => {
    const { term } = req.query;
    if (!term) return res.json([]);

    const sql = `
        SELECT 
            p.PatientID, p.patient_name, p.phone_no, p.external_id, 
            p.group_name, p.RegDate, p.age, p.gender,
            -- Look at the status and balance of the LATEST record only
            b.Status AS current_status,
            COALESCE(b.balance, 0) AS current_balance
        FROM patients p
        LEFT JOIN (
            SELECT pb1.* FROM patient_billing_details pb1
            WHERE pb1.id = (SELECT MAX(id) FROM patient_billing_details pb2 WHERE pb2.PatientID = pb1.PatientID)
        ) b ON p.PatientID = b.PatientID
        WHERE p.patient_name LIKE ? 
           OR p.PatientID LIKE ? 
           OR p.phone_no LIKE ? 
        GROUP BY p.PatientID
        ORDER BY p.RegDate DESC 
        LIMIT 50`;

    const searchVal = `%${term}%`;
    db.query(sql, [searchVal, searchVal, searchVal], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

//126
app.get('/api/get-group-members/:groupId', (req, res) => {
    const { groupId } = req.params;

    const sql = `
        SELECT 
            p.PatientID, 
            p.patient_name, 
            p.group_name,
            b.Status AS current_status,
            COALESCE(b.balance, 0) AS current_balance
        FROM patients p
        LEFT JOIN (
            /* This subquery ensures we only get the latest billing status for each patient */
            SELECT pb1.* FROM patient_billing_details pb1
            WHERE pb1.id = (SELECT MAX(id) FROM patient_billing_details pb2 WHERE pb2.PatientID = pb1.PatientID)
        ) b ON p.PatientID = b.PatientID
        WHERE p.GroupID = ?
        /* Grouping by PatientID prevents duplicate rows if a patient has multiple billing entries */
        GROUP BY p.PatientID 
        ORDER BY p.patient_name ASC`;

    db.query(sql, [groupId], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

//127
app.post('/api/save-billing', async (req, res) => {
    const { invoice_no, sample_id, billingRecords } = req.body;
    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Initialize Waterfall Payment (Total amount paid by the patient)
        let remainingPayment = parseFloat(billingRecords[0]?.amount_paid || 0);

        for (const record of billingRecords) {
            const isProfile = 
                record.item_type?.toLowerCase() === 'profile' || 
                (record.test_code && record.test_code.startsWith('PR'));

            const actualId = record.id || record.TestID || record.profile_id;

            // --- FIX 1: CLIENT CODE LOOKUP ---
            let finalClientCode = record.client_code;
            if (record.client_code && !isNaN(record.client_code)) {
                const [clientResult] = await connection.query(
                    "SELECT client_code FROM client_codes WHERE id = ?", 
                    [record.client_code]
                );
                if (clientResult.length > 0) {
                    finalClientCode = clientResult[0].client_code;
                }
            }

            // --- FIX 2: SQL QUERY ALIGNMENT (27 Columns Total) ---
            const insertSql = `INSERT INTO patient_billing_details 
                (PatientID, TestID, profile_id, Status, Amount, billing_type, 
                location_code, doctor_id, amount_paid, payment_modes, invoice_no, 
                sample_id, patient_name, balance, collected_at_id, client_code, 
                group_name, insurance_payer, policy_number, hospital_name, 
                acc_holder, acc_no, cheque_no, bank_name, trans_id, digital_mode,
                bill_date, payment_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;

            if (isProfile) {
                // Profile Logic
                const [mappedTests] = await connection.query(
                    "SELECT test_id FROM profiletestmapping WHERE profile_id = ?", 
                    [actualId]
                );

                for (const test of mappedTests) {
                    const [testData] = await connection.query("SELECT Price FROM tests WHERE TestID = ?", [test.test_id]);
                    const individualPrice = testData.length > 0 ? parseFloat(testData[0].Price) : 0;

                    let paidToSave = 0;
                    if (remainingPayment >= individualPrice) {
                        paidToSave = individualPrice;
                        remainingPayment -= individualPrice;
                    } else {
                        paidToSave = remainingPayment;
                        remainingPayment = 0;
                    }

                    const balanceToSave = individualPrice - paidToSave;
                    const paymentDate = (paidToSave > 0) ? new Date() : null;

                    // --- FIX 3: MATCH PARAMETERS TO COLUMNS ---
                    await connection.query(insertSql, [
                        record.PatientID, test.test_id, actualId, record.Status, 
                        individualPrice, record.billing_type, record.location_code, record.doctor_id, 
                        paidToSave, record.payment_modes, invoice_no, sample_id, record.patient_name, 
                        balanceToSave, record.collected_at_id, finalClientCode, record.group_name, 
                        record.insurance_payer, record.policy_no, record.hospital_name,
                        record.acc_holder, record.acc_no, record.cheque_no, record.bank_name, record.trans_id, record.digital_mode,
                        paymentDate
                    ]);
                }
            } else {
                // Single Test Logic
                const testPrice = parseFloat(record.Amount || 0);
                
                let paidToSave = 0;
                if (remainingPayment >= testPrice) {
                    paidToSave = testPrice;
                    remainingPayment -= testPrice;
                } else {
                    paidToSave = remainingPayment;
                    remainingPayment = 0;
                }

                const balanceToSave = testPrice - paidToSave;
                const paymentDate = (paidToSave > 0) ? new Date() : null;

                // --- FIX 4: MATCH PARAMETERS TO COLUMNS ---
                await connection.query(insertSql, [
                    record.PatientID, actualId, null, record.Status, 
                    testPrice, record.billing_type, record.location_code, record.doctor_id, 
                    paidToSave, record.payment_modes, invoice_no, sample_id, 
                    record.patient_name, balanceToSave, record.collected_at_id, 
                    finalClientCode, record.group_name, record.insurance_payer, 
                    record.policy_no, record.hospital_name,
                    record.acc_holder, record.acc_no, record.cheque_no, record.bank_name, record.trans_id, record.digital_mode,
                    paymentDate
                ]);
            }
        }

        await connection.commit();
        res.json({ success: true, invoice_no });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error("Save Billing Error:", err);
        res.status(500).json({ success: false, error: "Database error: " + err.message });
    } finally {
        if (connection) connection.release();
    }
});

//128
app.get('/api/collected-at', (req, res) => {
    const sql = "SELECT id, name, amount FROM collected_at ORDER BY name ASC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch error:", err);
            return res.status(500).json({ success: false, message: "Error fetching collection centers" });
        }
        res.status(200).json({ success: true, data: results });
    });
});
//129 server.js
app.post('/api/update-due', (req, res) => {
    const { patientId, payAmount, paymentMode } = req.body; // Added paymentMode

    if (!patientId || payAmount === undefined) {
        return res.status(400).json({ success: false, message: "Missing Patient ID or Amount" });
    }

    // 1. Fetch latest record
    const getLatest = `SELECT * FROM patient_billing_details WHERE PatientID = ? ORDER BY id DESC LIMIT 1`;
    
    db.query(getLatest, [patientId], (err, rows) => {
        if (err || rows.length === 0) return res.status(500).json({ success: false, message: "No record found" });

        const latest = rows[0];
        const totalBill = parseFloat(latest.Amount || 0);
        const previouslyPaid = parseFloat(latest.amount_paid || 0);
        const amountPayingNow = parseFloat(payAmount);

        const newPaid = previouslyPaid + amountPayingNow;
        const newBalance = Math.max(0, totalBill - newPaid); 
        const newStatus = newBalance <= 0 ? 'Approved' : 'Pending';

        // 2. INSERT the history row (Your existing logic)
        const insertSql = `INSERT INTO patient_billing_details (...) VALUES (...)`;
        
        // 3. UPDATE the original invoice record (THE MISSING STEP)
        // This ensures EditInvoice.js and InvoiceReport.js see the correct balance
        const updateInvoiceSql = `
            UPDATE patient_billing_details 
            SET amount_paid = ?, balance = ?, Status = ?
            WHERE invoice_no = ? AND id = (
                SELECT min_id FROM (
                    SELECT MIN(id) as min_id FROM patient_billing_details WHERE invoice_no = ?
                ) as t
            )`;

        db.beginTransaction((err) => {
            // Run Insert History
            db.query(insertSql, values, (err) => {
                if (err) return db.rollback(() => res.status(500).json({success: false}));

                // Run Update Main Record
                db.query(updateInvoiceSql, [newPaid, newBalance, newStatus, latest.invoice_no, latest.invoice_no], (err) => {
                    if (err) return db.rollback(() => res.status(500).json({success: false}));

                    db.commit((err) => {
                        res.json({ 
                            success: true, 
                            total_paid: newPaid, 
                            current_balance: newBalance, 
                            status: newStatus 
                        });
                    });
                });
            });
        });
    });
});

//130
app.post('/api/save-group-billing', async (req, res) => {
    const { 
        PatientID, patient_name, doctor_id, amount, amount_paid, 
        payment_modes, group_name, client_code, billing_type,
        TestID, test_id, profile_id, ProfileID, collected_at_id, 
        location_id, locationCode, // Incoming string code (e.g., 'MYL001')
        test_names, insurance_payer, policy_no, hospital_name 
    } = req.body;

    const connection = await db.promise().getConnection();

    try {
        await connection.beginTransaction();

        // 1. Sync the Patient's master record with the current location code
        if (PatientID && locationCode) {
            await connection.query(
                "UPDATE patients SET Location = ? WHERE PatientID = ?", 
                [locationCode, PatientID]
            );
        }

        let finalProfileId = profile_id || ProfileID || null;
        if (finalProfileId && finalProfileId > 100) {
            const [rows] = await connection.query(
                "SELECT id FROM profiles WHERE profile_code = ? OR profile_code = ?", 
                [`PR${finalProfileId}`, finalProfileId]
            );
            if (rows.length > 0) finalProfileId = rows[0].id;
        }

        // 3. Generate common identifiers
        const invoice_no = 'INV-' + Date.now();
        const sample_id = 'SMP-' + Math.floor(1000 + Math.random() * 9000);
        let remainingPayment = parseFloat(amount_paid || 0);

        // Updated SQL: explicitly using location_code column
        const insertSql = `INSERT INTO patient_billing_details 
            (PatientID, TestID, profile_id, Status, Amount, billing_type, doctor_id, 
             amount_paid, payment_modes, invoice_no, sample_id, patient_name, balance, 
             collected_at_id, location_code, client_code, group_name, insurance_payer, 
             policy_number, hospital_name, test_names, bill_date, payment_date) 
            VALUES (?, ?, ?, 'Approved', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`;

        const isProfile = !!finalProfileId;
        const actualTestId = TestID || test_id || null;

        if (isProfile) {
            // Waterfall logic: Split payment across tests inside the profile
            const [mappedTests] = await connection.query(
                "SELECT test_id FROM profiletestmapping WHERE profile_id = ?", 
                [finalProfileId]
            );

            for (const test of mappedTests) {
                const [testData] = await connection.query("SELECT Price FROM tests WHERE TestID = ?", [test.test_id]);
                const individualPrice = testData.length > 0 ? parseFloat(testData[0].Price) : 0;

                let paidToSave = 0;
                if (remainingPayment >= individualPrice) {
                    paidToSave = individualPrice;
                    remainingPayment -= individualPrice;
                } else {
                    paidToSave = remainingPayment;
                    remainingPayment = 0;
                }

                const balanceToSave = individualPrice - paidToSave;
                const paymentDate = (paidToSave > 0) ? new Date() : null;

                await connection.query(insertSql, [
                    PatientID, test.test_id, finalProfileId, individualPrice, billing_type, 
                    doctor_id || 0, paidToSave, payment_modes, invoice_no, sample_id, 
                    patient_name, balanceToSave, collected_at_id || location_id, 
                    locationCode, client_code, group_name, insurance_payer, policy_no, 
                    hospital_name, test_names, paymentDate
                ]);
            }
        } else {
            // Logic for a single test
            const totalAmount = parseFloat(amount || 0);
            let paidToSave = Math.min(remainingPayment, totalAmount);
            const balanceToSave = totalAmount - paidToSave;
            const paymentDate = (paidToSave > 0) ? new Date() : null;

            await connection.query(insertSql, [
                PatientID, actualTestId, null, totalAmount, billing_type, 
                doctor_id || 0, paidToSave, payment_modes, invoice_no, sample_id, 
                patient_name, balanceToSave, collected_at_id || location_id, 
                locationCode, client_code, group_name, insurance_payer, policy_no, 
                hospital_name, test_names, paymentDate
            ]);
        }

        await connection.commit();
        res.json({ success: true, invoiceNo: invoice_no, sampleId: sample_id });

    } catch (err) {
        await connection.rollback();
        console.error("Group Billing Error:", err);
        res.status(500).json({ success: false, error: err.message || "Database transaction failed" });
    } finally {
        connection.release();
    }
});

//131
app.get('/api/get-billing-history', (req, res) => {
    // This query joins patients and billing to show the latest records first
    const sql = `
        SELECT * FROM patient_billing_details 
        ORDER BY bill_date DESC 
        LIMIT 50
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


//132
app.get('/api/patient-history/:patientId', (req, res) => {
    const { patientId } = req.params;

    const sql = `
        SELECT 
            p.patient_name,
            p.PatientID,
            DATE_FORMAT(pb.bill_date, '%Y-%m-%d') AS date,
            pb.ResultValue AS value, 
            pb.Status AS billingStatus,
            t.TestName AS test_display_name,
            tem.unit AS element_unit,
            CONCAT(COALESCE(tem.lower_limit, ''), '-', COALESCE(tem.upper_limit, '')) AS element_range,
            tt.test_content
        FROM patient_billing_details pb
        JOIN patients p ON pb.PatientID = p.PatientID
        LEFT JOIN tests t ON pb.TestID = t.TestID
        LEFT JOIN test_element_templates tem ON pb.TestID = tem.element_id
        LEFT JOIN test_templates tt ON pb.TestID = tt.test_id
        WHERE p.PatientID = ?
        ORDER BY pb.bill_date ASC;
    `;

    db.query(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        if (results.length === 0) return res.json({ success: true, data: { records: [] } });

        const processedRecords = results.map(row => {
            // 1. Extract numeric value for graphing
            const rawValue = row.value !== null ? String(row.value) : '';
            const match = rawValue.match(/(\d+(\.\d+)?)/);
            const numericValue = match ? parseFloat(match[0]) : null;

            // 2. Logic to get correct Range and Units from Template if Join failed
            let normalRange = (row.element_range && row.element_range !== '-' && row.element_range !== '--') 
                ? row.element_range 
                : "-";
            let units = row.element_unit || "-";

            if ((normalRange === "-" || units === "-") && row.test_content) {
                try {
                    const content = typeof row.test_content === 'string' ? JSON.parse(row.test_content) : row.test_content;
                    if (Array.isArray(content) && content.length > 0) {
                        normalRange = content[0].range || content[0].reference_range || normalRange;
                        units = content[0].unit || units;
                    }
                } catch (e) { /* ignore parse errors */ }
            }

            return {
                date: row.date,
                testName: row.test_display_name || "General Test",
                value: row.value || 'Pending',
                numericValue: numericValue,
                units: units.trim(),
                referenceRange: normalRange, // This ensures the modal shows the correct 4.5-7.0 etc.
                status: row.billingStatus
            };
        });

        res.json({
            success: true,
            data: {
                patientName: results[0].patient_name,
                patientId: results[0].PatientID,
                records: processedRecords
            }
        });
    });
});

//133
app.get('/api/approver-queue', (req, res) => {
    let { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
        const today = new Date();
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        fromDate = lastMonth.toISOString().split('T')[0];
        toDate = today.toISOString().split('T')[0];
    }

    const sql = `
    SELECT 
        -- Scrub '0' from Patient Name
        COALESCE(NULLIF(TRIM(MAX(p.patient_name)), '0'), 'Unknown Patient') AS name,
        p.PatientID AS patientId,
        MAX(p.external_id) AS extId,
        MAX(p.client_code) AS code,
        -- Scrub '0' from Doctor Name
        COALESCE(NULLIF(TRIM(MAX(d.doctor_name)), '0'), 'Self') AS refBy, 
        -- Scrub '0' from Collection Center
        COALESCE(NULLIF(TRIM(MAX(ca.name)), '0'), 'Main Lab') AS collAt,
        COALESCE(MAX(b.sample_id), MAX(p.sample_id)) AS sampleId,
        DATE_FORMAT(MAX(p.RegDate), '%d-%m-%Y %H:%i') AS date,
        0 AS isCritical,
        CASE 
            WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) < COUNT(b.id) 
                 AND TIMESTAMPDIFF(HOUR, MAX(p.RegDate), NOW()) > 4 THEN 1 
            ELSE 0 
        END AS isOverdue,
        CASE 
            WHEN COUNT(b.id) = 0 THEN '0' 
            WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(b.id) AND COUNT(b.id) > 0 THEN '3' 
            WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) > 0 THEN '2'
            ELSE '1'
        END AS labStatus,
        CASE 
            WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(b.id) AND COUNT(b.id) > 0 THEN 'Completed'
            WHEN SUM(CASE WHEN b.Status = 'Pending' THEN 1 ELSE 0 END) > 0 THEN 'Pending'
            ELSE 'Partial'
        END AS status,
        COUNT(b.id) AS billed,
        SUM(CASE WHEN b.Status = 'Pending' THEN 1 ELSE 0 END) AS saved,
        SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) AS approved,
        (COUNT(b.id) - SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END)) AS pending
    FROM patients p
    LEFT JOIN patient_billing_details b ON p.PatientID = b.PatientID
    LEFT JOIN doctor_details d ON b.doctor_id = d.id
    LEFT JOIN collected_at ca ON b.collected_at_id = ca.id
    WHERE p.RegDate BETWEEN ? AND ?
    GROUP BY p.PatientID
    ORDER BY MAX(p.RegDate) DESC
`;

    db.query(sql, [`${fromDate} 00:00:00`, `${toDate} 23:59:59`], (err, results) => {
        if (err) {
            console.error("Approver API Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.json({ success: true, data: results });
    });
});

//134
app.get('/api/patient-results/:patientId', (req, res) => {
    const { patientId } = req.params;

    const sql = `
        SELECT 
            p.patient_name, p.Age, p.Gender, p.client_code,
            pb.sample_id, pb.Status AS status, pb.group_name, 
            pb.ResultValue AS val,          -- Pulls 116
            pb.LabComments AS dbComment, 
            DATE_FORMAT(p.RegDate, '%d/%m/%Y') AS createdDate,
            COALESCE(d.doctor_name, 'Self') AS refBy, 
            COALESCE(ca.name, 'Main Lab') AS collAt,
            t.TestName, t.Units,
            tt.test_content                -- FETCHING THE JSON CONTENT
        FROM patients p
        LEFT JOIN patient_billing_details pb ON p.PatientID = pb.PatientID
        LEFT JOIN doctor_details d ON pb.doctor_id = d.id
        LEFT JOIN collected_at ca ON pb.collected_at_id = ca.id
        LEFT JOIN tests t ON pb.TestID = t.TestID
        LEFT JOIN test_templates tt ON t.TestID = tt.test_id -- JOINING TEMPLATES
        WHERE p.PatientID = ?
    `;

    db.query(sql, [patientId], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        if (results.length === 0) return res.status(404).json({ success: false });

        const patientInfo = {
            name: results[0].patient_name,
            age: results[0].Age,
            gender: results[0].Gender,
            sampleId: results[0].sample_id,
            createdDate: results[0].createdDate,
            doctor: results[0].refBy,
            clientCode: results[0].client_code || '-',
            collectedAt: results[0].collAt
        };

        const testResults = results.map(row => {
            let finalRange = "N/A";
            let finalUnit = row.Units || "-";

            // Parse the JSON test_content from test_templates table
            if (row.test_content) {
                try {
                    const parsed = JSON.parse(row.test_content);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        // Extract the range and unit from the first item in JSON
                        finalRange = parsed[0].range; 
                        finalUnit = parsed[0].unit;
                    }
                } catch (e) {
                    console.error("JSON parse error for test_content:", e);
                }
            }

            return {
                name: row.TestName || row.group_name,
                unit: finalUnit,            // Now from JSON
                range: finalRange,          // Now from JSON (13.5-17.5...)
                status: row.status,
                val: row.val || "",         // Still 116
                comment: row.dbComment || ""
            };
        });

        res.json({ success: true, patientInfo, testResults });
    });
});
//135 --- 2. FETCH HISTORICAL TRENDS ---
app.get('/api/test-history', (req, res) => {
    const { patientId, testName } = req.query;

    const sql = `
        SELECT 
            DATE_FORMAT(pb.bill_date, '%d/%m') AS date, 
            pb.ResultValue AS val
        FROM patient_billing_details pb
        LEFT JOIN tests t ON pb.TestID = t.TestID
        WHERE pb.PatientID = ? 
          AND (
            t.TestName = ? 
            OR pb.group_name = ? 
            OR pb.test_names LIKE ?
          )
          AND pb.ResultValue IS NOT NULL
        ORDER BY pb.bill_date ASC
    `;

    // We search using the exact testName passed from the UI
    db.query(sql, [patientId, testName, testName, `%${testName}%`], (err, results) => {
        if (err) return res.status(500).json({ success: false });
        
        // Convert the string "116" from your DB into a number for the chart
        const history = results.map(row => ({
            date: row.date,
            val: parseFloat(row.val) || 0
        }));

        res.json({ success: true, history });
    });
});

//136
app.get('/api/test-history-v2', (req, res) => {
    const { patientId, testName } = req.query;
    const sql = `
        SELECT 
            DATE_FORMAT(bill_date, '%d/%m') AS date, 
            TRIM(culture_report) AS val
        FROM patient_billing_details
        WHERE PatientID = ? 
          AND (
            LOWER(group_name) LIKE LOWER(?) 
            OR LOWER(test_names) LIKE LOWER(?)
            OR (test_names IS NULL AND group_name IS NOT NULL) 
          )
          AND culture_report IS NOT NULL 
          AND culture_report REGEXP '^[0-9]+(\\.[0-9]+)?$'
        ORDER BY bill_date ASC
        LIMIT 10
    `;

    const searchStr = `%${testName}%`;
    
    db.query(sql, [patientId, searchStr, searchStr], (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        }
        res.json({ success: true, history: results });
    });
});

//137

app.post('/api/approve-test', (req, res) => {
    const { patientId, sampleId, results, userRole } = req.body; // Pass userRole from frontend

    // Secure check: Prevent Admins from bypassing the UI
    if (userRole === 'Lab') {
        return res.status(403).json({ success: false, message: "Lab staff are not authorized to approve clinical results." });
    }

    if (!results || results.length === 0) {
        return res.status(400).json({ success: false, message: "No results provided" });
    }


    // 1. Update the specific tests
    const queries = results.map(item => {
        return new Promise((resolve, reject) => {
            // FIX: Ensure we use the correct property names from your frontend object
            const testIdentifier = item.testName || item.name; 
            const val = item.value || item.val;

            const sql = `
                UPDATE patient_billing_details 
                SET ResultValue = ?, 
                    LabComments = ?, 
                    Status = 'Approved' 
                WHERE sample_id = ? 
                AND (TestID IN (SELECT TestID FROM tests WHERE TestName = ?) OR group_name = ?)`;
            
            db.query(sql, [val, item.comment, sampleId, testIdentifier, testIdentifier], (err, result) => {
                if (err) {
                    console.error("Update Row Error:", err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    });

    Promise.all(queries)
        .then(() => {
            // 2. Sync the status so other screens see it as 'Approved'
            // Change 'Completed' to 'Approved' if your other screens filter for 'Approved'
            const finalizeSql = `
                UPDATE patient_billing_details 
                SET Status = 'Approved' 
                WHERE sample_id = ?`;

            db.query(finalizeSql, [sampleId], (err) => {
                if (err) {
                    console.error("Finalize error:", err);
                    return res.status(500).json({ success: false });
                }
                res.json({ success: true, message: "Status updated to Approved across all screens." });
            });
        })
        .catch(err => {
            console.error("Promise.all error:", err);
            res.status(500).json({ success: false, error: err.message });
        });
});

// 138--- UPDATE THIS ROUTE IN server.js ---
app.delete('/api/patients/:id', (req, res) => {
    const patientId = req.params.id;

    // Step 1: Delete dependent billing records first
    const deleteBilling = "DELETE FROM patient_billing_details WHERE PatientID = ?";
    
    db.query(deleteBilling, [patientId], (err) => {
        if (err) return res.status(500).send(err);

        // Step 2: Delete the patient after billing is cleared
        const deletePatient = "DELETE FROM patients WHERE PatientID = ?";
        db.query(deletePatient, [patientId], (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ message: "Patient and billing records deleted successfully" });
        });
    });
});

//139
app.get('/api/get-table-view-data', (req, res) => {
    // We fetch Status and SampleID directly from the billing details
    const query = `
        SELECT 
            p.PatientID, 
            p.patient_name, 
            COALESCE(pb.Status, 'Pending') AS Status, 
            DATE_FORMAT(p.RegDate, '%Y-%m-%d %H:%i') AS RegDate, 
            COALESCE(pb.sample_id, p.sample_id) AS SampleID 
        FROM patients p
        LEFT JOIN (
            /* We use a subquery to get the most recent billing entry per patient */
            SELECT PatientID, Status, sample_id
            FROM patient_billing_details
            WHERE id IN (SELECT MAX(id) FROM patient_billing_details GROUP BY PatientID)
        ) pb ON p.PatientID = pb.PatientID
        ORDER BY p.RegDate DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(results || []); 
    });
});

//140
app.get('/api/patient-files/:sampleId', (req, res) => {
    const { sampleId } = req.params;
    
    // We look inside: ./uploads/patient_files/[sampleId]
    const uploadDir = path.join(__dirname, 'uploads', 'patient_files', sampleId);

    // If folder doesn't exist, return empty arrays
    if (!fs.existsSync(uploadDir)) {
        return res.json({ success: true, wordFiles: [], imageFiles: [] });
    }

    try {
        const files = fs.readdirSync(uploadDir);
        const wordFiles = [];
        const imageFiles = [];

        files.forEach(file => {
            const ext = path.extname(file).toLowerCase();
            const fileInfo = {
                file_path: file,
                url: `http://localhost:5000/uploads/patient_files/${sampleId}/${file}` 
            };

            if (['.doc', '.docx'].includes(ext)) {
                wordFiles.push(fileInfo);
            } else if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
                imageFiles.push(fileInfo);
            }
        });

        res.json({ success: true, wordFiles, imageFiles });
    } catch (err) {
        console.error("Directory Read Error:", err);
        res.status(500).json({ success: false, message: "Error reading files" });
    }
});

//141 --- 1. GET FILES ROUTE ---
app.get('/api/patient-files/:sampleId', (req, res) => {
    const { sampleId } = req.params;
    const dir = path.join(__dirname, 'uploads', 'patient_files', sampleId);

    if (!fs.existsSync(dir)) {
        return res.json({ success: true, wordFiles: [], imageFiles: [] });
    }

    const files = fs.readdirSync(dir);
    const wordFiles = [];
    const imageFiles = [];

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        const fileObj = { file_path: file };
        
        if (['.doc', '.docx'].includes(ext)) {
            wordFiles.push(fileObj);
        } else if (['.jpg', '.jpeg', '.png', '.pdf'].includes(ext)) {
            imageFiles.push(fileObj);
        }
    });

    res.json({ success: true, wordFiles, imageFiles });
});

//142 --- 2. UPLOAD FILES ROUTE ---
app.post('/api/upload-patient-files', uploadAttachment.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No files received" });
    }
    res.json({ success: true, message: "Upload successful" });
});

//143
app.get('/api/get-amend-data', (req, res) => {
    const query = `
        SELECT 
            -- Patient Identity
            b.patient_name,
            b.PatientID,
            p.external_id AS ExternalID,
            b.client_code AS ClientCode,
            b.sample_id AS SampleID,
            
            -- Dates and Grouping
            COALESCE(p.RegDate, b.bill_date) AS RegDate,
            COALESCE(ca.name, 'Main Center') AS CollectedAt,
            COALESCE(d.doctor_name, 'SELF') AS ReferredBy,
            
            -- Lab Status & Payment Status Logic
            CASE 
                WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(b.id) THEN 'Completed'
                WHEN SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) > 0 THEN 'In Progress'
                ELSE 'Pending'
            END AS LabStatus,
            
            CASE 
                WHEN SUM(IFNULL(b.balance, 0)) > 0 THEN 'Unpaid'
                ELSE 'Paid'
            END AS Status,

            -- Test Counts (Aliased to match Frontend)
            COUNT(b.id) AS TotalBilled,
            COUNT(b.id) AS TestSaved,
            SUM(CASE WHEN b.Status = 'Confirmed' THEN 1 ELSE 0 END) AS ConfirmedTest,
            SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) AS ApprovedTest,
            SUM(CASE WHEN b.Status != 'Approved' THEN 1 ELSE 0 END) AS PendingApproval,
            
            -- Test Complete Logic
            CASE 
                WHEN COUNT(b.id) > 0 AND SUM(CASE WHEN b.Status = 'Approved' THEN 1 ELSE 0 END) = COUNT(b.id) 
                THEN 'Yes' 
                ELSE 'No' 
            END AS TestCompleted
            
        FROM patient_billing_details b
        LEFT JOIN patients p ON b.PatientID = p.PatientID
        LEFT JOIN doctor_details d ON b.doctor_id = d.id
        LEFT JOIN collected_at ca ON b.collected_at_id = ca.id
        GROUP BY b.sample_id, b.PatientID, b.patient_name
        ORDER BY RegDate DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Database Error:", err);
            return res.status(500).json({ error: "Query failed", details: err.message });
        }
        res.json(results);
    });
});

//144
app.get('/api/get-tests-by-sample/:sampleId', (req, res) => {
    const query = "SELECT test_name FROM patient_billing_details WHERE sample_id = ?";
    db.query(query, [req.params.sampleId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
//145
app.get('/api/get-test-results/:sampleId', (req, res) => {
    const { sampleId } = req.params;

    const query = `
        SELECT 
            pbd.id AS billing_id, 
            pbd.id,           
            pbd.TestID,       
            pbd.ResultValue, 
            pbd.LabComments, 
            pbd.Status, 
            pbd.patient_name, 
            pbd.PatientID, 
            pbd.bill_date AS CreateDate, 
            pbd.client_code,
            t.TestName AS TestDetails, 
            t.Units, 
            tt.test_content,
            -- NEW: Fetch master range data from element templates
            tem.unit AS master_unit,
            tem.lower_limit,
            tem.upper_limit,
            COALESCE(prof.profile_name, 'Individual Test') AS CategoryName,
            COALESCE(d.doctor_name, 'Self') AS referred_by,
            pat.Age, 
            pat.Gender, 
            pat.external_id,
            COALESCE(pbd.location_code, 'Main Lab') AS collected_at
        FROM patient_billing_details pbd
        INNER JOIN tests t ON pbd.TestID = t.TestID
        LEFT JOIN profiles prof ON pbd.profile_id = prof.id
        LEFT JOIN test_templates tt ON t.TestID = tt.test_id
        -- NEW JOIN: Access the master numeric limits
        LEFT JOIN test_element_templates tem ON pbd.TestID = tem.element_id
        LEFT JOIN patients pat ON pbd.PatientID = pat.PatientID
        LEFT JOIN doctor_details d ON pbd.doctor_id = d.id
        WHERE pbd.sample_id = ?
        ORDER BY pbd.id ASC;
    `;

    db.query(query, [sampleId], (err, results) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ error: err.message });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "No results found" });
        }

        const formattedResults = results.map(row => {
            // 1. Calculate a fallback range from master limits if JSON is empty
            let masterRange = "-";
            if (row.lower_limit !== null || row.upper_limit !== null) {
                masterRange = `${row.lower_limit || ''} - ${row.upper_limit || ''}`;
            }

            let parsedComponents = [];
            try {
                parsedComponents = (row.test_content) ? JSON.parse(row.test_content) : [];
            } catch (e) { 
                parsedComponents = []; 
            }

            if (parsedComponents.length > 0) {
                // 2. If JSON exists but range is "Refer to Master" or empty, inject the masterRange
                if (!parsedComponents[0].range || parsedComponents[0].range === "Refer to Master") {
                    parsedComponents[0].range = masterRange;
                }
                parsedComponents[0].result = row.ResultValue || "";
                parsedComponents[0].comments = row.LabComments || ""; 
            } else {
                parsedComponents = [{ 
                    name: row.TestDetails, 
                    range: masterRange, 
                    unit: row.master_unit || row.Units || "N/A",
                    result: row.ResultValue || "",
                    comments: row.LabComments || ""
                }];
            }
            
            // Return everything from the row plus the updated components
            return { ...row, components: parsedComponents };
        });

        res.json(formattedResults);
    });
});

// 146Backend API Route: GET /api/tests
app.get('/api/tests', (req, res) => {
    const sql = "SELECT TestID, TestName, Department FROM tests WHERE IsActive = 1";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});


// 147Update or Confirm Test Results - NOW WITH TESTID
app.post('/api/update-test-result', (req, res) => {
    const { id, testId, value, comments, status } = req.body;
    
    // We target the row by ID, but we MUST differentiate by TestID 
    // to stop the "mirroring" effect.
    const sql = `
        UPDATE patient_billing_details 
        SET ResultValue = ?, LabComments = ?, Status = COALESCE(?, Status)
        WHERE id = ? AND (TestID = ? OR profile_id IS NOT NULL)`; 
        // Note: If your table structure doesn't support multiple rows per test yet, 
        // this is a temporary bridge.

    db.query(sql, [value, comments, status, id, testId], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: err });
        res.json({ success: true, message: "Updated successfully" });
    });
});

//148 Delete Test - NOW WITH TESTID
app.delete('/api/deletetest/:id/:testId', (req, res) => {
    const { id, testId } = req.params;
    db.query("DELETE FROM patient_billing_details WHERE id = ? AND TestID = ?", [id, testId], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

// 149Backend API Route: POST /api/group-registration
app.post('/api/group-registration', (req, res) => {
    const { patient_id, test_id, group_name, amount } = req.body;

    const sql = `
        INSERT INTO patient_billing_details 
        (PatientID, TestID, group_name, Amount, billing_type, Status) 
        VALUES (?, ?, ?, ?, 'group', 'Approved')
    `;

    db.query(sql, [patient_id, test_id, group_name, amount], (err, result) => {
        if (err) return res.status(500).send(err);
        res.send({ message: "Registration Successful", id: result.insertId });
    });
});

//150
app.post('/api/tests/save-modal-data', async (req, res) => {
    const { testId, tableName, dataRows, mainTableColumn } = req.body;

    // 1. Safety Check: Only allow our 7 specific tables
    const allowedTables = [
        'test_components', 
        'test_calculations', 
        'test_age_reference', 
        'test_age_critical', 
        'test_pregnancy_reference', 
        'test_biopsy', 
        'test_images'
    ];

    if (!allowedTables.includes(tableName)) {
        return res.status(400).json({ error: "Invalid table name provided" });
    }

    try {
        
        await db.query(`DELETE FROM ${tableName} WHERE TestID = ?`, [testId]);

        // 3. Insert new entries if any exist in the array
        if (dataRows && dataRows.length > 0) {
            for (const row of dataRows) {
                const columns = Object.keys(row);
                const values = Object.values(row);
                
                // Build a dynamic query: INSERT INTO table (TestID, col1, col2) VALUES (?, ?, ?)
                const placeholders = columns.map(() => '?').join(', ');
                const sql = `INSERT INTO ${tableName} (TestID, ${columns.join(', ')}) VALUES (?, ${placeholders})`;
                
                await db.query(sql, [testId, ...values]);
            }
        }

        // 4. Update the "Yes/No" status in the main tests table
        const hasData = dataRows.length > 0 ? 'Yes' : 'No';
        await db.query(`UPDATE tests SET ${mainTableColumn} = ? WHERE TestID = ?`, [hasData, testId]);

        // 5. Success response
        res.status(200).json({ 
            success: true, 
            message: `Successfully synced ${tableName}` 
        });

    } catch (error) {
        console.error("Database Error at line 3679:", error);
        res.status(500).json({ error: "Failed to save modal data", details: error.message });
    }
});

//151
app.get('/api/stats/samples-count', (req, res) => {
    // This counts every unique sample_id in your billing table
    const sql = "SELECT COUNT(DISTINCT sample_id) AS total FROM patient_billing_details";
    
    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, count: result[0].total });
    });
});
//152
app.post('/api/add-test-to-billing', async (req, res) => {
    const { 
        sample_id, item_id, item_type, patient_id, invoice_no, 
        patient_name, doctor_id, location_code, client_code 
    } = req.body;

    try {
        // 1. FETCH METADATA: We look for the most recent valid billing entry
        // We filter out 'Null' strings and actual NULLs to find the real metadata
        const sqlGetMeta = `
            SELECT billing_type, group_name, insurance_payer, policy_number, hospital_name, collected_at_id
            FROM patient_billing_details 
            WHERE invoice_no = ? 
            AND billing_type IS NOT NULL 
            AND billing_type != 'Null'
            ORDER BY id DESC LIMIT 1`;
        
        const metaResults = await query(sqlGetMeta, [invoice_no]);
        
        // Fallback if this is the first ever entry for this invoice
        const meta = metaResults.length > 0 ? metaResults[0] : { 
            billing_type: 'self', 
            group_name: null, 
            insurance_payer: null, 
            policy_number: null, 
            hospital_name: null,
            collected_at_id: null
        };

        const sqlInsert = `
            INSERT INTO patient_billing_details 
            (PatientID, patient_name, TestID, sample_id, invoice_no, doctor_id, 
             location_code, client_code, Status, Amount, amount_paid, balance, 
             bill_date, billing_type, group_name, insurance_payer, 
             policy_number, hospital_name, collected_at_id, test_names) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, 0, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`;

        // --- CASE A: PROFILE ---
        if (item_type === 'profile') {
            const sqlMapping = `
                SELECT m.test_id, t.TestName, p.amount as total_profile_amount 
                FROM profiletestmapping m
                JOIN profiles p ON m.profile_id = p.id
                JOIN tests t ON m.test_id = t.TestID
                WHERE m.profile_id = ?`;

            const mappingResults = await query(sqlMapping, [item_id]);
            if (mappingResults.length === 0) return res.status(400).json({ success: false, message: "Profile empty." });

            const totalAmount = mappingResults[0].total_profile_amount;

            for (let i = 0; i < mappingResults.length; i++) {
                const row = mappingResults[i];
                const priceToRecord = (i === 0) ? totalAmount : 0;

                await query(sqlInsert, [
                    patient_id, patient_name, row.test_id, sample_id, invoice_no, 
                    doctor_id, location_code, client_code, priceToRecord, priceToRecord,
                    meta.billing_type, meta.group_name, meta.insurance_payer, 
                    meta.policy_number, meta.hospital_name, meta.collected_at_id, row.TestName
                ]);
            }
            return res.json({ success: true, message: "Profile added successfully" });
        } 
        
        // --- CASE B: INDIVIDUAL TEST ---
        else {
            const testResult = await query("SELECT TestName, Price FROM tests WHERE TestID = ?", [item_id]);
            const amount = testResult.length > 0 ? testResult[0].Price : 0;
            const testName = testResult.length > 0 ? testResult[0].TestName : 'Unknown Test';

            await query(sqlInsert, [
                patient_id, patient_name, item_id, sample_id, invoice_no, 
                doctor_id, location_code, client_code, amount, amount,
                meta.billing_type, meta.group_name, meta.insurance_payer, 
                meta.policy_number, meta.hospital_name, meta.collected_at_id, testName
            ]);
            return res.json({ success: true, message: "Test added successfully" });
        }

    } catch (err) {
        console.error("Billing Insert Error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
//153
app.get('/api/all-available-tests', (req, res) => {
    // Select only from tests table as requested
    const sql = `
        SELECT 
            TestID as id, 
            TestName as name, 
            Price as amount, 
            'test' as type 
        FROM tests 
        WHERE IsActive = 1 
        ORDER BY TestName ASC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        // Always return an array to prevent .filter errors
        res.json(results || []);
    });
});
//154
app.get('/api/add-test-header/:sampleId', (req, res) => {
    const { sampleId } = req.params;

    const sql = `
        SELECT 
            p.patient_name, 
            p.PatientID AS patient_id, 
            p.age, 
            p.gender, 
            p.external_id,
            b.invoice_no,
            b.doctor_id,      -- MUST fetch this so handleAddTest can use it
            b.location_code,   -- MUST fetch this so handleAddTest can use it
            b.bill_date AS registration_date,
            COALESCE(b.client_code, p.client_code) AS client_code,
            COALESCE(d.doctor_name, 'Self') AS referredBy
        FROM patient_billing_details b
        LEFT JOIN patients p ON b.PatientID = p.PatientID
        LEFT JOIN doctor_details d ON b.doctor_id = d.id
        WHERE b.sample_id = ?
        LIMIT 1;
    `;

    db.query(sql, [sampleId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        
        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "Sample ID not found" });
        }
        
        res.json({ success: true, data: results[0] });
    });
});
//155
app.get('/api/test-results/:sampleId', async (req, res) => {
    const { sampleId } = req.params;

    try {
        const mysql = require('mysql2/promise'); 
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '', 
            database: 'myapp_db'
        });

        // JOINING billing -> doctor_details -> user_profiles to fetch the signature
        const [rows] = await connection.execute(`
            SELECT 
                t.TestName AS test_names,
                pbd.ResultValue,
                pbd.LabComments,
                tt.test_content AS template_json,
                t.Units AS master_units,
                pbd.is_critical,
                pbd.culture_report,
                up.FirstName,
                up.LastName,
                up.PostgraduateDegree,
                up.SignaturePath
            FROM patient_billing_details pbd
            LEFT JOIN tests t ON pbd.TestID = t.TestID
            LEFT JOIN test_templates tt ON t.TestID = tt.test_id
            LEFT JOIN doctor_details dd ON pbd.doctor_id = dd.id
            LEFT JOIN user_profiles up ON dd.doctor_name LIKE CONCAT('%', up.FirstName, '%')
            WHERE pbd.sample_id = ? AND pbd.ResultValue IS NOT NULL
        `, [sampleId]);

        await connection.end();

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "No results found" });
        }

        // Format Test Data
        const formattedData = rows.map(row => {
            let range = "As per age";
            let unit = row.master_units || "";
            if (row.template_json) {
                try {
                    const parsed = typeof row.template_json === 'string' ? JSON.parse(row.template_json) : row.template_json;
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        range = parsed[0].range || range;
                        unit = parsed[0].unit || unit;
                    }
                } catch (e) { /* silent catch */ }
            }
            return {
                test_names: row.test_names,
                result: row.ResultValue,
                normal_range: range,
                unit: unit,
                labcomments: row.LabComments,
                is_critical: row.is_critical
            };
        });

        // Convert Signature to Base64
        let signatureBase64 = "";
        const doctor = rows[0]; 
        if (doctor && doctor.SignaturePath) {
            try {
                const fs = require('fs');
                const path = require('path');
                // Normalize path for Windows/Linux
                const fullPath = path.join(__dirname, doctor.SignaturePath.replace(/\\/g, '/'));
                if (fs.existsSync(fullPath)) {
                    const bitmap = fs.readFileSync(fullPath);
                    const ext = path.extname(fullPath).replace('.', '');
                    signatureBase64 = `data:image/${ext};base64,${bitmap.toString('base64')}`;
                }
            } catch (err) { console.error("Signature Error:", err); }
        }
const cultureReportValue = rows[0]?.culture_report || "";
        // Sending the object the frontend is looking for
        res.json({ 
            success: true, 
            data: formattedData,
            culture_report: cultureReportValue, 
            doctorInfo: {
                doctor_name: doctor.FirstName ? `Dr. ${doctor.FirstName} ${doctor.LastName || ''}` : "Authorized Signatory",
                PostgraduateDegree: doctor.PostgraduateDegree || "Consultant Pathologist",
                signatureBase64: signatureBase64
            }
        });

    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});
//156
app.post('/api/update-special-comments', (req, res) => {
    const { sampleId, comments } = req.body;

    if (!sampleId) {
        return res.status(400).json({ success: false, message: "Sample ID is required" });
    }

    // We update all records with this sample_id so the comment appears on the whole report
    const sql = `UPDATE patient_billing_details SET culture_report = ? WHERE sample_id = ?`;

    db.query(sql, [comments, sampleId], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        
        res.json({ 
            success: true, 
            message: "Comments updated", 
            affectedRows: result.affectedRows 
        });
    });
});
//157
app.get('/api/sample-collection-list', async (req, res) => {
    const { locationCode, fromDate, toDate } = req.query;

    const start = fromDate && fromDate !== "" ? fromDate : '2000-01-01 00:00:00';
    const end   = toDate && toDate !== "" ? toDate : '2099-12-31 23:59:59';

    // This query gets ALL details for every test in a bill
   const sql = `
    SELECT 
        pb.sample_id AS sampleId,
        pb.PatientID AS patientId,
        p.patient_name AS patientName,
        p.external_id AS externalId,
        d.doctor_name AS referredBy,
        COALESCE(pb.client_code, p.client_code, 'Direct') AS clientCode,
        IFNULL(c.name, 'Walk-in') AS collectedAt,
        pb.Status AS status,
        pb.balance AS balance,              /* <--- ADD THIS LINE */
        DATE_FORMAT(pb.bill_date, '%Y-%m-%d %H:%i') AS createDate,
        t.TestName AS testName,
        t.SampleContainer AS containerType,
        t.Department AS department,
        DATE_FORMAT(pb.payment_date, '%Y-%m-%d %H:%i') AS paymentDate
        FROM patient_billing_details pb
        LEFT JOIN patients p ON pb.PatientID = p.PatientID
        LEFT JOIN doctor_details d ON pb.doctor_id = d.id
        LEFT JOIN collected_at c ON pb.collected_at_id = c.id
        LEFT JOIN tests t ON pb.TestID = t.TestID
        WHERE pb.location_code = ? 
        AND pb.bill_date BETWEEN ? AND ?
        ORDER BY pb.bill_date DESC
    `;

    try {
        // Use .promise() if you haven't changed your global import to mysql2/promise
        const [rows] = await db.promise().query(sql, [locationCode, start, end]);
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});

//158
app.post('/api/reject-sample', (req, res) => {
    const { sampleId, userRole } = req.body;

    if (userRole !== 'Lab') {
        return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Wrap in a try-catch or ensure sequential execution
    const updateBilling = "UPDATE patient_billing_details SET Status = 'Rejected' WHERE sample_id = ?";
    
    db.query(updateBilling, [sampleId], (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, error: "Database update failed" });
        }

        // Only insert notification if the update actually happened
        const createAlert = "INSERT INTO critical_notifications (sample_id, message) VALUES (?, ?)";
        const alertMsg = `Critical: Sample ${sampleId} rejected.`;

        db.query(createAlert, [sampleId, alertMsg], (err) => {
            if (err) console.error("Notification Error:", err); // Log but don't fail the whole request
            res.json({ success: true, message: "Sample rejected." });
        });
    });
});

//159
app.delete('/api/pathologist/permanent-delete/:sampleId', (req, res) => {
    const { sampleId } = req.params;
    const userRole = req.query.userRole; // Changed from req.body

    if (userRole !== 'Pathologist') {
        return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Updated SQL: Removed the 'rejected' requirement to match your database state
    const sql = "DELETE FROM patient_billing_details WHERE sample_id = ?";

    db.query(sql, [sampleId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: "No rejected record found with this ID." 
            });
        }
        
        // 3. Clear the notification
        db.query("DELETE FROM critical_notifications WHERE sample_id = ?", [sampleId]);
        
        res.json({ success: true, message: "Test record permanently deleted." });
    });
});

//160
app.get('/api/notifications/unread', (req, res) => {
    let { doctorName } = req.query;
    if (!doctorName) return res.status(400).json({ success: false, message: "Name required" });

    // 1. Clean the input: Remove "Dr." prefix and any leading/trailing spaces
    // This turns "Dr. Deepa" or "Deepa" into just "Deepa"
    const coreName = doctorName.replace(/^Dr\.?\s*/i, '').trim();

    const selectSql = `
        SELECT 
            n.*, 
            p.patient_name 
        FROM critical_notifications n
        JOIN patient_billing_details p ON n.sample_id = p.sample_id
        JOIN doctor_details d ON p.doctor_id = d.id
        WHERE n.is_read = FALSE 
        AND (
            d.doctor_name LIKE ? -- Matches "Dr. Deepa", "Deepa", etc.
            OR d.doctor_name = ?   -- Fallback for exact match
        )
    `;

    // Use wildcards to find the name regardless of "Dr." or "Dr. " prefixes
    const searchParam = `%${coreName}%`;

    db.query(selectSql, [searchParam, doctorName], (err, results) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true, notifications: results });
    });
});

//161
app.get('/api/elements/list', (req, res) => {
    // Join with Tests table to get test_name and check multipleComponents status
    const sql = `
        SELECT 
            te.ElementID as id, 
            te.ElementName as element_name, 
            te.TestCode as test_code, 
            te.Priority as priority, 
            te.Priority as existing_priority,
            t.TestName as test_name,
            t.multipleComponents
        FROM TestElements te
        JOIN Tests t ON te.ParentTestID = t.TestID
        WHERE te.IsActive = 1
    `;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, error: err.message });
        res.json(results);
    });
});

//162
app.post('/api/notifications/mark-read/:id', (req, res) => {
    const { id } = req.params;
    const sql = "UPDATE critical_notifications SET is_read = TRUE WHERE id = ?";
    db.query(sql, [id], (err) => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true });
    });
});

//163
// DELETE a specific template by testId
app.delete('/api/delete-template/:testId', (req, res) => {
    const { testId } = req.params;

    const sql = "DELETE FROM test_templates WHERE test_id = ?";

    db.query(sql, [testId], (err, result) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ success: false, message: "Server error" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Template not found" });
        }

        res.json({ success: true, message: "Template deleted successfully" });
    });
});

//163
app.get('/api/system-health', async (req, res) => {
    try {
        // Check DB connection by running a simple query
        await db.promise().query('SELECT 1');
        
        res.json({
            database: "Stable",
            printer: "Connected", // You can add logic here to check printer APIs
            labApi: "Active"
        });
    } catch (err) {
        res.status(500).json({
            database: "Down",
            printer: "Error",
            labApi: "Inactive"
        });
    }
});



const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));