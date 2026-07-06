import { Routes, Route, useLocation } from "react-router-dom";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import HomePage from "@/pages/home";
import MixDetailPage from "@/pages/mix-detail";

export default function App() {
  const location = useLocation();
  const background = (location.state as { backgroundLocation?: Location } | null)
    ?.backgroundLocation;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1" id="main-content">
        {/* Always render gallery (or standalone detail if accessed directly) */}
        <Routes location={background ?? location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/mix/:id" element={<MixDetailPage />} />
        </Routes>
      </main>
      <SiteFooter />

      {/* Modal overlay when navigating from gallery */}
      {background && (
        <Routes>
          <Route path="/mix/:id" element={<MixDetailPage modal />} />
        </Routes>
      )}
    </div>
  );
}
