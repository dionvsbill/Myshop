import Header from "../../components/Header";
import Footer from "../../components/Footer";
import MobileBottomNav from "../../components/MobileBottomNav";
export default function PublicLayout({children}:{children:React.ReactNode}){return <><Header/><main className="page"><div className="mainContent">{children}</div></main><Footer/><MobileBottomNav/></>}