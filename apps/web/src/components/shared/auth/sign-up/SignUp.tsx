'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { GoogleIcon } from '../CustomIcons';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import AuthLayout from '../AuthLayout';
import { useAuth } from '@/context/AuthContext';
import { isValidPhoneNumber } from 'libphonenumber-js';

export default function SignUp() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [phoneNumberError, setPhoneNumberError] = React.useState(false);
  const [phoneNumberErrorMessage, setPhoneNumberErrorMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const validateInputs = () => {
    const email = document.getElementById('email') as HTMLInputElement;
    const password = document.getElementById('password') as HTMLInputElement;
    const name = document.getElementById('name') as HTMLInputElement;
    const phoneNumber = document.getElementById('phoneNumber') as HTMLInputElement;

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (!phoneNumber.value || !isValidPhoneNumber(phoneNumber.value)) {
      setPhoneNumberError(true);
      setPhoneNumberErrorMessage('Please enter a valid phone number.');
      isValid = false;
    } else {
      setPhoneNumberError(false);
      setPhoneNumberErrorMessage('');
    }

    return isValid;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nameError || emailError || passwordError || phoneNumberError) {
      return;
    }
    const data = new FormData(event.currentTarget);
    const name = data.get('name') as string;
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const phoneNumber = data.get('phoneNumber') as string;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, phoneNumber }),
      });

      if (res.ok) {
        await refreshUser();
        router.push('/');
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      alert('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Sign up">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <FormControl>
          <FormLabel htmlFor="name">Full name</FormLabel>
          <TextField
            autoComplete="name"
            name="name"
            required
            fullWidth
            id="name"
            placeholder="Jon Snow"
            error={nameError}
            helperText={nameErrorMessage}
            color={nameError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="phoneNumber">Phone Number</FormLabel>
          <TextField
            required
            fullWidth
            id="phoneNumber"
            placeholder="+1234567890"
            name="phoneNumber"
            autoComplete="tel"
            variant="outlined"
            error={phoneNumberError}
            helperText={phoneNumberErrorMessage}
            color={phoneNumberError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="email">Email</FormLabel>
          <TextField
            required
            fullWidth
            id="email"
            placeholder="your@email.com"
            name="email"
            autoComplete="email"
            variant="outlined"
            error={emailError}
            helperText={emailErrorMessage}
            color={passwordError ? 'error' : 'primary'}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="password">Password</FormLabel>
          <TextField
            required
            fullWidth
            name="password"
            placeholder="••••••"
            type="password"
            id="password"
            autoComplete="new-password"
            variant="outlined"
            error={passwordError}
            helperText={passwordErrorMessage}
            color={passwordError ? 'error' : 'primary'}
          />
        </FormControl>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          onClick={validateInputs}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Signing up...' : 'Sign up'}
        </Button>
        {isSubmitting && (
          <Typography variant="caption" sx={{ textAlign: 'center', color: 'text.secondary' }}>
            Creating your account...
          </Typography>
        )}
      </Box>
      <Divider>
        <Typography sx={{ color: 'text.secondary' }}>or</Typography>
      </Divider>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => alert('Sign up with Google')}
          startIcon={<GoogleIcon />}
        >
          Sign up with Google
        </Button>
        <Typography sx={{ textAlign: 'center' }}>
          Already have an account?{' '}
          <Link
            href="/sign-in"
            variant="body2"
            sx={{ alignSelf: 'center' }}
            component={NextLink}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
