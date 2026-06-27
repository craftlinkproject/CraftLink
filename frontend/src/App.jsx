// ===================== React Imports ===================== //
import React, { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-photo-view/dist/react-photo-view.css';
import FirebaseRedirectHandler from './components/FirebaseRedirectHandler';
// ===================== Pages Imports ===================== //

const SignUp = lazy(() =>
  import('@pages/website').then(m => ({ default: m.SignUp }))
);

const SignIn = lazy(() =>
  import('@pages/website').then(m => ({ default: m.SignIn }))
);

const ResetPassword = lazy(() =>
  import('@pages/website').then(m => ({ default: m.ResetPassword }))
);

const ViewCourse = lazy(() =>
  import('@pages/website').then(m => ({ default: m.ViewCourse }))
);

const Main = lazy(() =>
  import('@pages/website').then(m => ({ default: m.Main }))
);

const HelpCenter = lazy(() =>
  import('@pages/website').then(m => ({ default: m.HelpCenter }))
);

const About = lazy(() =>
  import('@pages/website').then(m => ({ default: m.About }))
);

const ContactUs = lazy(() =>
  import('@pages/website').then(m => ({ default: m.ContactUs }))
);

const PrivacyPolicy = lazy(() =>
  import('@pages/website').then(m => ({ default: m.PrivacyPolicy }))
);

const TermsPage = lazy(() =>
  import('@pages/website').then(m => ({ default: m.TermsPage }))
);
const PaymentSuccess = lazy(() =>
  import('@pages/website').then(m => ({ default: m.PaymentSuccess }))
);

const PaymentFail = lazy(() =>
  import('@pages/website').then(m => ({ default: m.PaymentFail }))
);
const Search = lazy(() =>
  import('@pages/website').then(m => ({ default: m.Search }))
);

const CertificateVerification = lazy(() =>
  import('@pages/website').then(m => ({ default: m.CertificateVerification }))
);


const Profile = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.Profile }))
);

const Message = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.Message }))
);

const CreateCourse = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.CreateCourse }))
);

const CreateLecture = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.CreateLecture }))
);
const TimeLine = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.TimeLine }))
);
const SinglePost = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.SinglePost }))
);
const PlayCourse = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.PlayCourse }))
);

const Dashboard = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.Dashboard }))
);

const InstructorWithdraw = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.InstructorWithdraw }))
);

const AdminLogin = lazy(() =>
  import('@pages/admin').then(m => ({ default: m.AdminLogin }))
);

// ===================== Components Imports ===================== //
import { ScrollToTop, LoadingFire } from '@components';
import useCurrentUser from './customHooks/getCurrentUser';
import getCreatorCourse from './customHooks/getCreatorCourse';
import useGetPublishedCourse from './customHooks/useGetPublishedCourse';
import PrivateRoute from '../PrivateRoute';
import GuestRoute from '../GuestRoute';
import { serverUrl as configServerUrl } from '../config/server';
export const serverUrl = configServerUrl;
import AISupportChat from './components/AISupportChat';

export default function App() {
  getCreatorCourse();
  useGetPublishedCourse();
  const loadingUser = useCurrentUser(); // Hook
  const location = useLocation();

const hideChat =
  location.pathname === "/message" ||
  location.pathname.startsWith("/message/");
  if (loadingUser) {
    return (
      <LoadingFire />
    );
  }

  return (
    <>
      <FirebaseRedirectHandler />
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        icon={true}
        toastClassName="custom-toast"
        bodyClassName="custom-toast-body"
        progressClassName="custom-toast-progress"
      />
      <ScrollToTop />
      {!hideChat && <AISupportChat />}
      <Suspense fallback={<LoadingFire />}>
        <Routes>
          <Route path='/' element={<Main />} />
          <Route path='/search' element={<Search />} />
          <Route path='/signup' element={<GuestRoute loading={loadingUser}><SignUp /></GuestRoute>} />
          <Route path='/signin' element={<GuestRoute loading={loadingUser}><SignIn /></GuestRoute>} />
          <Route path='/resetpassword' element={<GuestRoute loading={loadingUser}><ResetPassword /></GuestRoute>} />
          <Route path="/profile/:userId" element={<PrivateRoute allowedRoles={[0, 1, 2, 3]}><Profile /></PrivateRoute>} />
          <Route path="/message/:userId" element={<PrivateRoute allowedRoles={[0, 1, 2, 3]}><Message /></PrivateRoute>} />
          <Route path="/message" element={<PrivateRoute allowedRoles={[1, 2, 3]}><Message /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute allowedRoles={[1, 2, 3]}><Profile /></PrivateRoute>} />
          <Route path='/helpcenter' element={<HelpCenter />} />
          <Route path='/viewcourse/:courseId' element={<ViewCourse />} />
          <Route path='/createcourse' element={<PrivateRoute allowedRoles={[1, 2, 0]}><CreateCourse /></PrivateRoute>} />
          <Route path="/createcourse/:courseId" element={<PrivateRoute allowedRoles={[1, 2, 0]}><CreateCourse /></PrivateRoute>} />
          <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
          <Route path="/payment/fail" element={<PrivateRoute><PaymentFail /></PrivateRoute>} />
          <Route path='createcourse/createLecture/:courseId' element={<PrivateRoute allowedRoles={[1, 2, 0]}><CreateLecture /></PrivateRoute>} />
          <Route path='about' element={<About />} />
          <Route path='contactus' element={<ContactUs />} />
          <Route path='privacy-policy' element={<PrivacyPolicy />} />
          <Route path='terms' element={<TermsPage />} />
          <Route path='timeline' element={<PrivateRoute><TimeLine /></PrivateRoute>} />
          <Route path='timeline/post/:postId' element={<PrivateRoute><SinglePost /></PrivateRoute>} />
          <Route path='/playCourse/:courseId' element={<PrivateRoute><PlayCourse /></PrivateRoute>} />
          <Route path='/verify-certificate' element={<CertificateVerification />} />
          <Route path='/admin-login' element={<GuestRoute loading={loadingUser}><AdminLogin /></GuestRoute>} />
          <Route path='/dashboard' element={<PrivateRoute allowedRoles={[0]}><Dashboard /></PrivateRoute>} />
          <Route path='/instructor-withdraw' element={<PrivateRoute allowedRoles={[2]}><InstructorWithdraw /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </>
  )
}
