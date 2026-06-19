import React, { useEffect, useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  applyOnboarding,
  getOnboardingApplications
} from '../api/onboardingApi';
import { useRealtimeEvent } from '../realtime/RealtimeContext.jsx';
import RiskBadge from '../components/RiskBadge.jsx';
import RiskScoreCard from '../components/RiskScoreCard.jsx';
import Loader from '../components/Loader.jsx';
import { formatDate } from '../utils/formatDate';

// ----- Validation schema -----
const validationSchema = Yup.object({
  full_name: Yup.string()
    .trim()
    .min(3, 'Name is too short')
    .max(80, 'Name is too long')
    .required('Full name is required'),
  email: Yup.string()
    .trim()
    .email('Enter a valid email')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, 'Phone must be exactly 10 digits')
    .required('Phone is required'),
  dob: Yup.date()
    .max(new Date(), 'Date of birth cannot be in the future')
    .required('Date of birth is required'),
  city: Yup.string().trim().required('City is required'),
  country: Yup.string().trim().required('Country is required'),
  device_id: Yup.string().trim().required('Device ID is required'),
  ip_address: Yup.string()
    .matches(
      /^(\d{1,3}\.){3}\d{1,3}$/,
      'Enter a valid IPv4 address (e.g. 192.168.1.50)'
    )
    .required('IP address is required'),
  document_id: Yup.string()
    .trim()
    .matches(/^[A-Z0-9_-]+$/i, 'Use letters, digits, hyphen or underscore only')
    .required('Document ID is required'),
  document_match_score: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .required('Required'),
  selfie_match_score: Yup.number()
    .typeError('Must be a number')
    .min(0, 'Min 0')
    .max(100, 'Max 100')
    .required('Required'),
  form_completion_seconds: Yup.number()
    .typeError('Must be a number')
    .integer('Must be an integer')
    .min(0, 'Min 0')
    .required('Required'),
  otp_attempts: Yup.number()
    .typeError('Must be a number')
    .integer('Must be an integer')
    .min(0, 'Min 0')
    .required('Required')
});

// ----- Preset templates -----
// We tag each preset's identifying fields with a fresh suffix so that
// repeatedly clicking a preset does NOT accumulate duplicate-detection
// penalties (which were forcing every submission to look like fraud).
function uniquify(base) {
  const tail = `${Date.now()}`.slice(-6);
  return {
    ...base,
    email: base.email.replace('@', `_${tail}@`),
    phone: `${base.phone.slice(0, 4)}${tail.slice(-6)}`.padEnd(10, '0').slice(0, 10),
    document_id: `${base.document_id}_${tail}`,
    device_id: base.device_id_unique ? `${base.device_id}_${tail}` : base.device_id
  };
}

const basePresets = {
  normal: {
    full_name: 'Rahul Patel',
    email: 'rahul@example.com',
    phone: '9876500011',
    dob: '2000-05-10',
    city: 'Surat',
    country: 'India',
    device_id: 'android_new_101',
    device_id_unique: true,
    ip_address: '192.168.1.50',
    document_id: 'DOC1001',
    document_match_score: 92,
    selfie_match_score: 88,
    form_completion_seconds: 180,
    otp_attempts: 1
  },
  suspicious: {
    full_name: 'Unknown User',
    email: 'fakeuser1@example.com',
    phone: '9999999999',
    dob: '2006-01-01',
    city: 'Delhi',
    country: 'India',
    device_id: 'bot_device_999',
    device_id_unique: false,
    ip_address: '45.99.88.77',
    document_id: 'DOC9999',
    document_match_score: 45,
    selfie_match_score: 38,
    form_completion_seconds: 8,
    otp_attempts: 5
  },
  critical: {
    full_name: 'Fake Bot User',
    email: 'botuser@example.com',
    phone: '8888888888',
    dob: '2010-01-01',
    city: 'Unknown',
    country: 'Russia',
    device_id: 'bot_device_999',
    device_id_unique: false,
    ip_address: '45.99.88.77',
    document_id: 'DOC9999',
    document_match_score: 25,
    selfie_match_score: 20,
    form_completion_seconds: 4,
    otp_attempts: 8
  }
};

const initial = (() => {
  const { device_id_unique, ...rest } = uniquify(basePresets.normal);
  return rest;
})();

export default function OnboardingPage() {
  const [applications, setApplications] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formValues, setFormValues] = useState(initial);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getOnboardingApplications();
      setApplications(data);
    } catch (err) {
      setError('Failed to load onboarding applications');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Refresh table when a new onboarding application is broadcast
  useRealtimeEvent('onboarding', () => {
    load();
  });

  function applyPreset(key, setValues) {
    const { device_id_unique, ...rest } = uniquify(basePresets[key]);
    setFormValues(rest);
    setValues(rest);
    setResult(null);
  }

  async function handleSubmit(values, { setSubmitting }) {
    setError('');
    setResult(null);
    try {
      const data = await applyOnboarding({
        ...values,
        document_match_score: Number(values.document_match_score),
        selfie_match_score: Number(values.selfie_match_score),
        form_completion_seconds: Number(values.form_completion_seconds),
        otp_attempts: Number(values.otp_attempts)
      });
      setResult(data);
      load();
    } catch (err) {
      setError('Onboarding analysis failed. Is the backend running?');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>KYC & Onboarding Fraud Detection</h2>
        <p className="muted">
          Score new applications against duplicate, document, selfie, device,
          and timing signals.
        </p>
      </div>

      <div className="grid-2">
        <div className="card glass">
          <Formik
            initialValues={formValues}
            enableReinitialize
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ setValues, isSubmitting, errors, touched }) => (
              <Form noValidate>
                <div className="preset-row">
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => applyPreset('normal', setValues)}
                  >
                    Normal Onboarding
                  </button>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => applyPreset('suspicious', setValues)}
                  >
                    Suspicious Onboarding
                  </button>
                  <button
                    type="button"
                    className="btn btn-light"
                    onClick={() => applyPreset('critical', setValues)}
                  >
                    Critical Onboarding
                  </button>
                </div>

                <div className="form-grid">
                  <FormikField name="full_name" label="Full Name" />
                  <FormikField name="email" label="Email" type="email" />
                  <FormikField name="phone" label="Phone" />
                  <FormikField name="dob" label="DOB" type="date" />
                  <FormikField name="city" label="City" />
                  <FormikField name="country" label="Country" />
                  <FormikField name="device_id" label="Device ID" />
                  <FormikField name="ip_address" label="IP Address" />
                  <FormikField name="document_id" label="Document ID" />
                  <FormikField
                    name="document_match_score"
                    label="Document Match Score"
                    type="number"
                    min="0"
                    max="100"
                  />
                  <FormikField
                    name="selfie_match_score"
                    label="Selfie Match Score"
                    type="number"
                    min="0"
                    max="100"
                  />
                  <FormikField
                    name="form_completion_seconds"
                    label="Form Completion Seconds"
                    type="number"
                    min="0"
                  />
                  <FormikField
                    name="otp_attempts"
                    label="OTP Attempts"
                    type="number"
                    min="0"
                  />
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Analyzing...' : 'Analyze Onboarding'}
                    </button>
                  </div>
                </div>

                {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && (
                  <div className="auth-error" style={{ marginTop: 10 }}>
                    Please fix the highlighted fields.
                  </div>
                )}
              </Form>
            )}
          </Formik>
          {error && <div className="error-banner">{error}</div>}
        </div>

        <div>
          {result ? (
            <RiskScoreCard
              riskScore={result.risk_score}
              riskLevel={result.risk_level}
              reasons={result.risk_reasons}
              recommendedAction={result.decision}
            />
          ) : (
            <div className="card glass placeholder-card">
              <div className="muted">Submit an application to see the engine result.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card glass">
        <div className="card-title">Onboarding Applications</div>
        {loading ? (
          <Loader />
        ) : applications.length === 0 ? (
          <div className="muted">No applications yet</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Country</th>
                  <th>Document ID</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Decision</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.id}</td>
                    <td>{a.full_name}</td>
                    <td>{a.email}</td>
                    <td>{a.phone}</td>
                    <td>{a.city}</td>
                    <td>{a.country}</td>
                    <td>{a.document_id}</td>
                    <td>{a.risk_score}</td>
                    <td><RiskBadge level={a.risk_level} /></td>
                    <td>{a.decision}</td>
                    <td>{formatDate(a.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Reusable Formik field ----------
function FormikField({ name, label, type = 'text', ...rest }) {
  return (
    <label className="formik-field">
      <span>{label}</span>
      <Field name={name} type={type} {...rest} />
      <ErrorMessage name={name} component="small" className="field-error" />
    </label>
  );
}
