'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    
    const search = new URLSearchParams(window.location.search);
    const queryToken = search.get('token');
    const queryError = search.get('error');

    if (queryError) {
      setStatus('error');
      setError(decodeURIComponent(queryError));
      return;
    }

    const finalToken = token || queryToken;

    if (finalToken) {
      localStorage.setItem('token', finalToken);
      setStatus('success');
      setTimeout(() => {
        window.location.href = '/chat';
      }, 1000);
    } else {
      setStatus('error');
      setError('No token received');
    }
  }, []);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-96">
        <CardHeader className="text-center">
          <CardTitle>
            {status === 'loading' && 'Completing Login...'}
            {status === 'success' && 'Login Successful!'}
            {status === 'error' && 'Login Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          {status === 'loading' && <Loader2 className="w-10 h-10 animate-spin text-blue-500" />}
          {status === 'success' && (
            <div className="text-center">
              <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-gray-500">Redirecting...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => router.push('/login')}>Try Again</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
