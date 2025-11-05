import PageMeta from "../components/common/PageMeta";
import AccountSettingsForm from "../components/UserProfile/AccountSettingsForm";

export default function AccountSettings() {
  return (
    <>
      <PageMeta
        title="Account Settings | SIP-KPBJ"
        description="Manage your account settings and profile information"
      />
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          <AccountSettingsForm />
        </div>
      </div>
    </>
  );
}
