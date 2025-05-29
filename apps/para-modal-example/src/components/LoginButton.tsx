import React from "react";
import { ParaModal, useModal, OAuthMethod, useAccount, useLogout } from "@getpara/react-sdk";
import { Button } from "@swig/ui";

export const LoginButton: React.FC = () => {
  const { openModal } = useModal();
  const { data: account } = useAccount();
  const { logoutAsync } = useLogout();

  const handleClick = () => {
    if (account?.isConnected) {
      logoutAsync();
    } else {
      openModal();
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant={account?.isConnected ? "secondary" : "primary"}
        className="w-full"
      >
        {account?.isConnected ? "Sign out" : "Sign in with Para"}
      </Button>

      <ParaModal
        appName="Para Modal Example"
        logo="https://onswig.com/raccoon-logo.svg"
        oAuthMethods={[OAuthMethod.GOOGLE, OAuthMethod.TWITTER, OAuthMethod.DISCORD]}
      />
    </>
  );
};
