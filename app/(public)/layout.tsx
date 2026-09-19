import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileBottomNav from "../../components/MobileBottomNav";
export default function PublicLayout({children}:{children:React.ReactNode}){return <><Header/><main className="min-h-[60vh]"><div className="container py-5 pb-24">{children}</div></main><Footer/><MobileBottomNav/></>}