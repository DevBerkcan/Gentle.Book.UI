// app/admin/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardBody } from '@nextui-org/card';
import { Input } from '@nextui-org/input';
import { Button } from '@nextui-org/button';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login({ 
        username: username.trim().toLowerCase(), 
        password 
      });
      
      if (result.success) {
        router.push('/admin/dashboard');
      } else {
        setError(result.message || 'Ungültige Anmeldedaten');
      }
    } catch (err: any) {
      setError(err.message || 'Ungültige Anmeldedaten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E1E1E] to-[#2C2C2C] flex items-center justify-center px-4">
      <Card className="max-w-md w-full border-2 border-[#E8C7C3]/20 shadow-2xl">
        <CardBody className="p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-[#E8C7C3] to-[#D8B0AC] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Lock className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-[#1E1E1E] mb-2">
              Anmelden
            </h1>
            <p className="text-[#8A8A8A]">
              Skinbloom Aesthetics Buchungssystem
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              type="text"
              label="Benutzername"
              placeholder="benutzername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              startContent={<User size={18} className="text-[#8A8A8A]" />}
              autoComplete="username"
              autoFocus
              isRequired
              classNames={{
                input: "text-[#1E1E1E]",
                label: "text-[#8A8A8A]",
                inputWrapper:
                  "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
              }}
            />

            <Input
              type={showPassword ? "text" : "password"}
              label="Passwort"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock size={18} className="text-[#8A8A8A]" />}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-[#8A8A8A] hover:text-[#1E1E1E] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              autoComplete="current-password"
              isRequired
              classNames={{
                input: "text-[#1E1E1E]",
                label: "text-[#8A8A8A]",
                inputWrapper:
                  "bg-white border-2 border-[#E8C7C3]/30 hover:border-[#E8C7C3]",
              }}
            />

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#E8C7C3] to-[#D8B0AC] text-white font-semibold shadow-lg"
              size="lg"
              isLoading={loading}
            >
              Anmelden
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}