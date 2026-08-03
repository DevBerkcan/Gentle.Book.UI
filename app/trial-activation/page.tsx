import { Suspense } from 'react';
import TrialActivationForm from './trial-activation-form';

export default function TrialActivationPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50 p-6" />}>
      <TrialActivationForm />
    </Suspense>
  );
}
