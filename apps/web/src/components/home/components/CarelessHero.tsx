'use client';
import * as React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import styles from './CarelessHero.module.css';

export default function CarelessHero() {
  return (
    <Box id="hero" className={styles.heroBox}>
      <Container className={styles.heroContainer}>
        <Stack spacing={2} useFlexGap className={styles.heroStack}>
          <Typography variant="h1" className={styles.heroTitle}>
            Organize&nbsp;
            <Typography component="span" variant="h1" className={styles.heroTitleHighlight}>
              Lifts
            </Typography>
          </Typography>
          <Typography className={styles.heroDescription}>
            If you are without a car{' '}
            <Box component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
              (car-less)
            </Box>{' '}
            or a driver who wishes to care less about organizing lifts,{' '}
            <Box component="span" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              CAReLESS
            </Box>{' '}
            is for you.
          </Typography>
          <Box className={styles.featureGrid}>
            <Box className={styles.featureBox}>
              <Box className={styles.featureHeader}>
                <CheckCircleRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Stop the endless WhatsApp polls
                </Typography>
              </Box>
              <Typography className={styles.featureReason}>
                No more &quot;Who&apos;s driving?&quot; spam. Automated matching handles it.
              </Typography>
            </Box>
            <Box className={styles.featureBox}>
              <Box className={styles.featureHeader}>
                <CheckCircleRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Match passengers efficiently
                </Typography>
              </Box>
              <Typography className={styles.featureReason}>
                Algorithms pair drivers with nearby passengers instantly.
              </Typography>
            </Box>
            <Box className={styles.featureBox}>
              <Box className={styles.featureHeader}>
                <CheckCircleRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Schedule recurring weekly lifts
                </Typography>
              </Box>
              <Typography className={styles.featureReason}>
                Set it once and forget it.
              </Typography>
            </Box>
            <Box className={styles.featureBox}>
              <Box className={styles.featureHeader}>
                <CheckCircleRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Find passengers on your route
                </Typography>
              </Box>
              <Typography className={styles.featureReason}>
                Algorithm calculates optimal detours for drivers.
              </Typography>
            </Box>
            <Box className={styles.featureBox}>
              <Box className={styles.featureHeader}>
                <CheckCircleRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Get automated lift reminders
                </Typography>
              </Box>
              <Typography className={styles.featureReason}>
                Push notifications ensure no one is left behind.
              </Typography>
            </Box>
            <Box className={styles.featureBox}>
              <Box className={styles.featureHeader}>
                <CheckCircleRoundedIcon color="primary" />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Reduce community carbon footprint
                </Typography>
              </Box>
              <Typography className={styles.featureReason}>
                Fewer cars on the road.
              </Typography>
            </Box>
          </Box>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            useFlexGap
            className={styles.buttonStack}
          >
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
