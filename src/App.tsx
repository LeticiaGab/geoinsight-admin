import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Surveys from "./pages/Surveys";
import Municipalities from "./pages/Municipalities";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import SurveyReview from "./pages/SurveyReview";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Layout />}>
            <Route index element={<Dashboard />} />
          </Route>
          <Route path="/users" element={<Layout />}>
            <Route index element={<Users />} />
          </Route>
          <Route path="/surveys" element={<Layout />}>
            <Route index element={<Surveys />} />
          </Route>
          <Route path="/municipalities" element={<Layout />}>
            <Route index element={<Municipalities />} />
          </Route>
          <Route path="/reports" element={<Layout />}>
            <Route index element={<Reports />} />
          </Route>
          <Route path="/settings" element={<Layout />}>
            <Route index element={<Settings />} />
          </Route>
          <Route path="/survey-review" element={<Layout />}>
            <Route index element={<SurveyReview />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
