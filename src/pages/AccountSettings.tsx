import PageMeta from "../components/common/PageMeta";
import AccountSettingsForm from "../components/UserProfile/AccountSettingsForm";

export default function AccountSettings() {
  return (
    <>
      <PageMeta
        title="Account Settings | SIP-KPBJ"
        description="Manage your account settings"
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <AccountSettingsForm />
        </div>
      </div>
    </>
  );
}
