import PageMeta from "../components/common/PageMeta";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import UserAddressCard from "../components/UserProfile/UserAddressCard";

export default function EditProfile() {
  return (
    <>
      <PageMeta
        title="Edit Profile | SIP-KPBJ"
        description="Edit your profile information"
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <UserInfoCard />
          <UserMetaCard />
        </div>
        <div className="space-y-6">
          <UserAddressCard />
        </div>
      </div>
    </>
  );
}
