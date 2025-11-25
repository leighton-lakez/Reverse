import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Filters from "./pages/Filters";
import Sell from "./pages/Sell";
import Notifications from "./pages/Notifications";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import ItemDetail from "./pages/ItemDetail";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import SellerSettings from "./pages/SellerSettings";
import OpenDispute from "./pages/OpenDispute";
import Chat from "./pages/Chat";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import ProfileSetup from "./pages/ProfileSetup";
import EditListing from "./pages/EditListing";
import EditDraft from "./pages/EditDraft";
import Settings from "./pages/Settings";
import FollowersList from "./pages/FollowersList";
import FollowingList from "./pages/FollowingList";
import Debug from "./pages/Debug";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMessages from "./pages/AdminMessages";
import AdminListings from "./pages/AdminListings";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";
import UnoGame from "./pages/UnoGame";
import FirstVisitReverse from "./components/FirstVisitReverse";
import ChatboxAssistant from "./components/ChatboxAssistant";

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
          <Route path="/filters" element={<Filters />} />
          <Route path="/sell" element={<Sell />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/item-detail" element={<ItemDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/seller-settings" element={<SellerSettings />} />
          <Route path="/open-dispute" element={<OpenDispute />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile-setup" element={<ProfileSetup />} />
          <Route path="/edit-listing/:id" element={<EditListing />} />
          <Route path="/edit-draft/:id" element={<EditDraft />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/followers" element={<FollowersList />} />
          <Route path="/followers/:userId" element={<FollowersList />} />
          <Route path="/following" element={<FollowingList />} />
          <Route path="/following/:userId" element={<FollowingList />} />
          <Route path="/debug" element={<Debug />} />
          <Route path="/uno" element={<UnoGame />} />
          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/messages" element={<AdminMessages />} />
          <Route path="/admin/listings" element={<AdminListings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatboxAssistant />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
