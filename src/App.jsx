import React from 'react';
import { useApp } from './context/AppContext';
import { DeviceFrameWrapper } from './components/common/DeviceFrameWrapper';
import { ScreenGalleryModal } from './components/common/ScreenGalleryModal';
import { DeleteReportDialog } from './screens/DeleteReportDialog';
import { MicrophonePermissionModal } from './screens/MicrophonePermissionModal';
import { AddHospitalModal } from './components/common/AddHospitalModal';

// Screens
import { SplashScreen } from './screens/SplashScreen';
import { OnboardingScreen1 } from './screens/OnboardingScreen1';
import { OnboardingScreen2 } from './screens/OnboardingScreen2';
import { OnboardingScreen3 } from './screens/OnboardingScreen3';
import { LoginScreen } from './screens/LoginScreen';
import { HomeDashboardScreen } from './screens/HomeDashboardScreen';
import { UploadReportScreen } from './screens/UploadReportScreen';
import { ProcessingReportScreen } from './screens/ProcessingReportScreen';
import { SuccessReportScreen } from './screens/SuccessReportScreen';
import { ExtractedReviewScreen } from './screens/ExtractedReviewScreen';
import { ReportDetailsScreen } from './screens/ReportDetailsScreen';
import { RecentReportsScreen } from './screens/RecentReportsScreen';
import { HealthTimelineScreen } from './screens/HealthTimelineScreen';
import { TrendChartScreen } from './screens/TrendChartScreen';
import { ProfilePrivacyScreen } from './screens/ProfilePrivacyScreen';
import { EmptyReportsScreen } from './screens/EmptyReportsScreen';
import { LoadingStateScreen } from './screens/LoadingStateScreen';
import { RetryUploadScreen } from './screens/RetryUploadScreen';
import { ErrorStateScreen } from './screens/ErrorStateScreen';
import { VoiceAnswerScreen } from './screens/VoiceAnswerScreen';
import { VoiceProcessingScreen } from './screens/VoiceProcessingScreen';
import { DesignSystemComparisonScreen } from './screens/DesignSystemComparisonScreen';
import { HospitalDetailsScreen } from './screens/HospitalDetailsScreen';
import { ContinuityIssuesScreen } from './screens/ContinuityIssuesScreen';

const PUBLIC_SCREENS = new Set([
  'splash',
  'onboarding_1',
  'onboarding_2',
  'onboarding_3',
  'login',
  'design_system'
]);

export const App = () => {
  const { currentScreen, isAuthenticated, isAuthLoading } = useApp();

  const renderScreen = () => {
    // Show smooth loading state while Firebase Auth restores session (except for splash screen)
    if (isAuthLoading && currentScreen !== 'splash') {
      return <LoadingStateScreen />;
    }

    // Protect authenticated routes: unauthenticated users redirect to Login
    if (!isAuthenticated && !PUBLIC_SCREENS.has(currentScreen)) {
      return <LoginScreen />;
    }



    switch (currentScreen) {
      case 'splash':
        return <SplashScreen />;
      case 'onboarding_1':
        return <OnboardingScreen1 />;
      case 'onboarding_2':
        return <OnboardingScreen2 />;
      case 'onboarding_3':
        return <OnboardingScreen3 />;
      case 'login':
        return <LoginScreen />;
      case 'home':
        return <HomeDashboardScreen />;
      case 'hospital_details':
        return <HospitalDetailsScreen />;
      case 'upload':
        return <UploadReportScreen />;
      case 'processing':
        return <ProcessingReportScreen />;
      case 'success':
        return <SuccessReportScreen />;
      case 'extracted_review':
        return <ExtractedReviewScreen />;
      case 'report_details':
        return <ReportDetailsScreen />;
      case 'recent_reports':
        return <RecentReportsScreen />;
      case 'timeline':
        return <HealthTimelineScreen />;
      case 'trend_chart':
        return <TrendChartScreen />;
      case 'profile':
        return <ProfilePrivacyScreen />;
      case 'empty_state':
        return <EmptyReportsScreen />;
      case 'loading_state':
        return <LoadingStateScreen />;
      case 'retry_upload':
        return <RetryUploadScreen />;
      case 'error_state':
        return <ErrorStateScreen />;
      case 'delete_dialog':
        return <DeleteReportDialog standalone={true} />;
      case 'voice_processing':
        return <VoiceProcessingScreen />;
      case 'voice_answer':
        return <VoiceAnswerScreen />;
      case 'mic_permission':
        return <MicrophonePermissionModal standalone={true} />;
      case 'design_system':
        return <DesignSystemComparisonScreen />;
      case 'continuity':
        return <ContinuityIssuesScreen />;
      default:
        return <HomeDashboardScreen />;
    }
  };

  return (
    <DeviceFrameWrapper>
      {renderScreen()}
      {/* Global Modals */}
      <ScreenGalleryModal />
      <DeleteReportDialog />
      <MicrophonePermissionModal />
      <AddHospitalModal />
    </DeviceFrameWrapper>
  );
};

export default App;
