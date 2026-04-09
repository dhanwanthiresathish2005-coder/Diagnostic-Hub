import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import FrontDesk from "./components/FrontDesk";
import Signup from './components/Signup';
import SampleCollect from './components/SampleCollect'; 
import ViewLocation from './components/ViewLocation'; 
import CreateUser from './components/CreateUser'; 
import AddOutOfHospital from "./components/AddOutOfHospital";
import AddGroup from './components/AddGroup'; 
import InsurancePage from './components/InsurancePage'; 
import TitleDetails from './components/TitleDetails';
import CollectedAt from './components/CollectedAt';
import DoctorDetails from './components/DoctorDetails';
import PatientDetails from './components/PatientDetails'; 
import DisplayCodes from './components/DisplayCodes'; 
import CustomerCare from './components/CustomerCare';
import AddTest from './components/AddTest';
import AddProfile from './components/AddProfile';
import AddTestElement from './components/AddTestElement';
import EditRateCard from './components/EditRateCard';
import LabView from './components/LabView';
import TemplateDetails from './components/TemplateDetails';
import DisableTest from './components/DisableTest';
import ViewEditTest from './components/ViewEditTest';
import EditTestDetail from './components/EditTestDetail'; 
import AddDepartment from './components/AddDepartment';
import DepartmentPriority from './components/DepartmentPriority';
import AddDepartmentPriority from './components/AddDepartmentPriority';
import AddTestPriority from './components/AddTestPriority';
import AddFreeTextTemplate from './components/AddFreeTextTemplate';
import AddIsolatedOrgans from './components/AddIsolatedOrgans';
import AddMicrobialAgent from './components/AddMicrobialAgent';
import EditPatient from './components/EditPatient';
import EditInvoice from './components/EditInvoice';
import AddLocationModal from "./components/AddLocationModal";
import PatientDetailScreen from './components/PatientDetailScreen'; 
import Workflow from './components/Workflow';
import InvoiceReport from './components/InvoiceReport'; 
import CampReport from './components/CampReport'; 
import Approver from './components/Approver'; 
import PatientApprovalDetail from './components/PatientApprovalDetail';
import TableView from './components/TableView';
import Ammend from './components/Ammend';
import AmendTest from './components/AmendTest';
import SampleDetail from './components/SampleDetail';
import SampleActionScreen from './components/SampleActionScreen';
import AddTestToSample from './components/AddTestToSample';
import { NotificationProvider } from './components/NotificationContext';
import { ValidationProvider } from './components/ValidationContext'; 
import FrontDeskSplash from './components/FrontDeskSplash';
import LocationDeskSplash from './components/LocationDeskSplash';
import LabDeskSplash from './components/LabDeskSplash';
import ApproverDeskSplash from './components/ApproverDeskSplash';
import CustomerDeskSplash from './components/CustomerDeskSplash';
import PatientDeskSplash from './components/PatientDeskSplash';
import TableDeskSplash from './components/TableDeskSplash';
import AmmendDeskSplash from './components/AmmendDeskSplash';
import PathoConsultSplash from './components/PathoConsultSplash';

function App() {
  return (
    <NotificationProvider>
      <ValidationProvider>
    <BrowserRouter>
      <Routes>
       <Route path="/" element={<PathoConsultSplash isInitialLoad={true} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/frontdesk" element={<FrontDesk />} />
        <Route path="/workflow" element={<Workflow />} />
        <Route path="/patient-detail-screen" element={<PatientDetailScreen />} /> 
        <Route path="/edit-invoice" element={<EditInvoice />} />
        <Route path="/invoice-report" element={<InvoiceReport />} />
        <Route path="/approver" element={<Approver />} />
        <Route path="/patient-approval-detail" element={<PatientApprovalDetail />} />
        <Route path="/lab-view" element={<LabView />} />
        <Route path="/sample-collect" element={<SampleCollect />} />
        <Route path="/view-location" element={<ViewLocation />} />
        <Route path="/create-user" element={<CreateUser />} />
        <Route path="/add-location-modal" element={<AddLocationModal />} />
        <Route path="/add-out-of-hospital" element={<AddOutOfHospital />} />
        <Route path="/add-group" element={<AddGroup />} />
        <Route path="/add-insurance" element={<InsurancePage />} />
        <Route path="/titles" element={<TitleDetails />} />
        <Route path="/collected-at" element={<CollectedAt />} />
        <Route path="/customer-care" element={<CustomerCare />} />
        <Route path="/add-patient" element={<PatientDetails />} />
        <Route path="/add-doctor" element={<DoctorDetails />} />
        <Route path="/display-codes" element={<DisplayCodes />} />
        <Route path="/add-test" element={<AddTest />} />
        <Route path="/add-profile" element={<AddProfile />} />
        <Route path="/add-test-element" element={<AddTestElement />} />
        <Route path="/edit-rate-card" element={<EditRateCard />} />
        <Route path="/template-details" element={<TemplateDetails />} />
        <Route path="/disable-test" element={<DisableTest />} />
        <Route path="/view-edit-test" element={<ViewEditTest/>} />
        <Route path="/edit-test/:id" element={<EditTestDetail />} />
        <Route path="/add-department" element={<AddDepartment />} />
        <Route path="/department-priority" element={<DepartmentPriority />} />
        <Route path="/add-department-priority" element={<AddDepartmentPriority />} />
        <Route path="/add-test-priority" element={<AddTestPriority />} />
        <Route path="/add-free-text-template" element={<AddFreeTextTemplate />} />
        <Route path="/add-isolated-organs" element={<AddIsolatedOrgans />} />
        <Route path="/add-microbial-agent" element={<AddMicrobialAgent />} />
        <Route path="/edit-patient/:id" element={<EditPatient />} />
        <Route path="/camp-report" element={<CampReport />} />
        <Route path="/table-view" element={<TableView />} />
        <Route path="/add-test-to-sample/:sampleId" element={<AddTestToSample />} />
        <Route path="/ammend" element={<Ammend />} />
        <Route path="/amend-test/:sampleId" element={<AmendTest />} />
        <Route path="/sample-detail/:sampleId" element={<SampleDetail />} />
        <Route path="/sample-action-screen/:sampleId" element={<SampleActionScreen />} />
        <Route path="/loading-frontdesk" element={<FrontDeskSplash />} />
        <Route path="/loading-locationdesk" element={<LocationDeskSplash />} />
        <Route path="/loading-labdesk" element={<LabDeskSplash />} />
        <Route path="/loading-approverdesk" element={<ApproverDeskSplash />} />
        <Route path="/loading-customerdesk" element={<CustomerDeskSplash />} />
        <Route path="/loading-patientdesk" element={<PatientDeskSplash />} />
        <Route path="/loading-tabledesk" element={<TableDeskSplash />} />
        <Route path="/loading-ammenddesk" element={<AmmendDeskSplash />} />
        <Route path="/notifications-center" element={<Home filter="rejected" />} />
        
        
      </Routes>
    </BrowserRouter>
    </ValidationProvider>
    </NotificationProvider>
  );
}

export default App;