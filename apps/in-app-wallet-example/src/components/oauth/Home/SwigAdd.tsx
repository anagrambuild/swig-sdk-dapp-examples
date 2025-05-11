import { useState } from "react";
import { useSwigContext } from "../../../context/SwigContext";
import { Button } from "@swig/ui";

export default function SwigAdd() {
  const {
    swigAddress,
    isSettingUp,
    permissionType,
    setPermissionType,
    setupSwigWallet,
    error,
  } = useSwigContext();
  if (!swigAddress) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-medium mb-4">Create a Swig Wallet</h2>
        <div className="flex flex-col gap-4 max-w-md mx-auto">
          {swigAddress && (
            <p>
              Your Swig wallet address is: <strong>{swigAddress}</strong>
            </p>
          )}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Permission Type</label>
              <div className="flex gap-4 justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="permissionType"
                    value="locked"
                    checked={permissionType === "locked"}
                    onChange={(e) => setPermissionType("locked")}
                    className="form-radio"
                  />
                  <span>Manage Authority Only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="permissionType"
                    value="permissive"
                    checked={permissionType === "permissive"}
                    onChange={(e) => setPermissionType("permissive")}
                    className="form-radio"
                  />
                  <span>All Permissions</span>
                </label>
              </div>
              <p className="text-sm text-gray-600">
                {permissionType === "locked"
                  ? "Root authority can only manage other roles. Additional roles will need to be created for spending SOL."
                  : "Root authority has full permissions including SOL spending."}
              </p>
            </div>
          </div>
          <Button
            onClick={setupSwigWallet}
            disabled={isSettingUp || !!swigAddress}
          >
            {isSettingUp ? "Setting up..." : "Set up Swig wallet"}
          </Button>
          {error && <p className="text-red-500">{error}</p>}
        </div>
      </div>
    );
  }
}
