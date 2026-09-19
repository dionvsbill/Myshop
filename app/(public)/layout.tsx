import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
export default function PublicLayout({children}:{children:React.ReactNode}){return <><Header/><main className="container py-6">{children}</main><Footer/></>}