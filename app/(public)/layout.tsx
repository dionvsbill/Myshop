import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">
        <div className="container py-8">{children}</div>
      </main>
      <Footer />
    </>
  );
}
