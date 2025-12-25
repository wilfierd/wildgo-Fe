import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Github } from 'lucide-react';
import { WS_BASE_URL } from '@/lib/api';

interface GitHubLoginButtonProps {
    onError?: (error: string) => void;
}

export default function GitHubLoginButton({ onError }: GitHubLoginButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleClick = () => {
        setLoading(true);
        // Web Flow - redirect to backend OAuth
        window.location.href = `${WS_BASE_URL}/api/auth/github/login`;
    };

    return (
        <Button
            variant="outline"
            onClick={handleClick}
            disabled={loading}
            className="w-full"
            type="button"
        >
            <Github className="mr-2 h-4 w-4" />
            {loading ? 'Redirecting...' : 'Login with GitHub'}
        </Button>
    );
}
