import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Sistem Pengawasan Terintegrasi dan Kolaboratif Pengadaan Barang dan Jasa"
        description="Sign Up"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
