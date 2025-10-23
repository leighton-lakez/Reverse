import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Sell from "./pages/Sell";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import ItemDetail from "./pages/ItemDetail";
import Checkout from "./pages/Checkout";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import ProfileSetup from "./pages/ProfileSetup";
import EditListing from "./pages/EditListing";
import Settings from "./pages/Settings";
import FollowersList from "./pages/FollowersList";
import FollowingList from "./pages/FollowingList";
import Debug from "./pages/Debug";
import NotFound from "./pages/NotFound";
import FirstVisitReverse from "./components/FirstVisitReverse";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FirstVisitReverse />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/item-detail" element={<ItemDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/followers" element={<FollowersList />} />
          <Route path="/followers/:userId" element={<FollowersList />} />
          <Route path="/following" element={<FollowingList />} />
          <Route path="/following/:userId" element={<FollowingList />} />
          <Route path="/debug" element={<Debug />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
