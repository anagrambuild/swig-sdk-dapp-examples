import React from 'react';
import { OAuthMethod } from '@getpara/web-sdk';

interface OAuthOption {
  method: OAuthMethod;
  label: string;
  icon: string;
}

const oAuthOptions: OAuthOption[] = [
  {
    method: OAuthMethod.GOOGLE,
    label: 'Continue with Google',
    icon: 'https://raw.githubusercontent.com/getpara/examples-hub/49741e549caf0ab25d980b907e89287f54720647/web/with-react-vite/custom-oauth-auth/public/google.svg',
  },
  {
    method: OAuthMethod.TWITTER,
    label: 'Continue with Twitter',
    icon: 'https://raw.githubusercontent.com/getpara/examples-hub/49741e549caf0ab25d980b907e89287f54720647/web/with-react-vite/custom-oauth-auth/public/twitter.svg',
  },
  {
    method: OAuthMethod.APPLE,
    label: 'Continue with Apple',
    icon: 'https://raw.githubusercontent.com/getpara/examples-hub/49741e549caf0ab25d980b907e89287f54720647/web/with-react-vite/custom-oauth-auth/public/apple.svg',
  },
  {
    method: OAuthMethod.DISCORD,
    label: 'Continue with Discord',
    icon: 'https://raw.githubusercontent.com/getpara/examples-hub/49741e549caf0ab25d980b907e89287f54720647/web/with-react-vite/custom-oauth-auth/public/discord.svg',
  },
  {
    method: OAuthMethod.FACEBOOK,
    label: 'Continue with Facebook',
    icon: 'https://raw.githubusercontent.com/getpara/examples-hub/49741e549caf0ab25d980b907e89287f54720647/web/with-react-vite/custom-oauth-auth/public/facebook.svg',
  },
  {
    method: OAuthMethod.FARCASTER,
    label: 'Continue with Farcaster',
    icon: 'https://raw.githubusercontent.com/getpara/examples-hub/49741e549caf0ab25d980b907e89287f54720647/web/with-react-vite/custom-oauth-auth/public/farcaster.svg',
  },
];

interface OAuthButtonsProps {
  onSelect: (method: OAuthMethod) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onSelect,
  isLoading,
  disabled = false,
}) => {
  return (
    <div className=' flex flex-col gap-3'>
      {oAuthOptions.map(({ method, label, icon }) => (
        <button
          key={method}
          onClick={() => onSelect(method)}
          disabled={isLoading || disabled}
          className='flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
        >
          <img src={icon} alt='' className='w-5 h-5' aria-hidden='true' />
          <span className='text-sm font-medium'>
            {isLoading ? 'Loading...' : label}
          </span>
        </button>
      ))}
    </div>
  );
};
