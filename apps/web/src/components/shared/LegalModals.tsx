import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({ open, onClose }: LegalModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      aria-labelledby="privacy-policy-title"
      aria-describedby="privacy-policy-description"
    >
      <DialogTitle id="privacy-policy-title">Privacy Policy</DialogTitle>
      <DialogContent dividers>
        <DialogContentText
          id="privacy-policy-description"
          tabIndex={-1}
          sx={{ '& p': { mb: 2 } }}
        >
          <p><strong>Effective Date:</strong> January 1, 2025</p>
          <p>
            At CAReLESS (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we prioritize the privacy and security of our users. This Privacy Policy outlines how we collect, use, and protect your information when you use our lift-organization platform.
          </p>
          <p><strong>1. Information We Collect</strong></p>
          <p>
            We collect information necessary to facilitate lift sharing within your community, including:
            <br />• <strong>Personal Information:</strong> Name, contact details (email, phone number), and address (for route calculation).
            <br />• <strong>Usage Data:</strong> Lift schedules, route preferences, and participation history.
          </p>
          <p><strong>2. How We Use Your Information</strong></p>
          <p>
            Your data is used solely for:
            <br />• Matching drivers with passengers based on location and schedule.
            <br />• Sending automated reminders and service updates.
            <br />• Improving the efficiency of our matching algorithms.
          </p>
          <p><strong>3. Data Sharing</strong></p>
          <p>
            We do not sell your personal data. Your contact and location information is shared <strong>only</strong> with the specific members of your community (e.g., your matched driver or passenger) for the purpose of coordinating a lift.
          </p>
          <p><strong>4. Data Security</strong></p>
          <p>
            We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure.
          </p>
          <p><strong>5. Your Rights</strong></p>
          <p>
            You have the right to access, correct, or delete your personal information at any time via your account settings or by contacting support.
          </p>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export function TermsOfServiceModal({ open, onClose }: LegalModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      scroll="paper"
      aria-labelledby="terms-of-service-title"
      aria-describedby="terms-of-service-description"
    >
      <DialogTitle id="terms-of-service-title">Terms of Service</DialogTitle>
      <DialogContent dividers>
        <DialogContentText
          id="terms-of-service-description"
          tabIndex={-1}
          sx={{ '& p': { mb: 2 } }}
        >
          <p><strong>Last Updated:</strong> January 1, 2025</p>
          <p>
            Welcome to CAReLESS. By using our platform, you agree to comply with and be bound by the following Terms of Service.
          </p>
          <p><strong>1. Acceptance of Terms</strong></p>
          <p>
            By accessing or using CAReLESS, you agree to these Terms. If you do not agree, you may not use the service.
          </p>
          <p><strong>2. Use of Service</strong></p>
          <p>
            CAReLESS is a tool for organizing voluntary lift sharing within communities. We are <strong>not</strong> a transportation provider.
            <br />• <strong>Drivers:</strong> You are responsible for maintaining a valid driver&apos;s license, insurance, and a safe vehicle.
            <br />• <strong>Passengers:</strong> You agree to be respectful and punctual.
          </p>
          <p><strong>3. Liability Disclaimer</strong></p>
          <p>
            CAReLESS facilitates connections but does not vet every driver or vehicle. You travel at your own risk. CAReLESS is not liable for any accidents, damages, or disputes arising from rides arranged through our platform.
          </p>
          <p><strong>4. User Conduct</strong></p>
          <p>
            Users must treat others with respect. Harassment, discrimination, or misuse of the platform will result in immediate account termination.
          </p>
          <p><strong>5. Changes to Terms</strong></p>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform constitutes acceptance of the new terms.
          </p>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
