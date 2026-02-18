"use client";

import { useState, useRef } from "react";
import { updateProfile, togglePrivacy, updateUserPassword, uploadAvatar, toggleParticipation } from "@/app/actions/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Shield, Save, Loader2, Eye, EyeOff, Lock, KeyRound, Camera, Ghost, Trophy, Palette, Sun } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

interface ProfileProps {
  user: {
    email: string;
  };
  profile: {
    full_name: string | null;
    is_anonymous: boolean;
    avatar_url: string | null;
    is_participating: boolean;
  } | null;
  academicSettings?: React.ReactNode;
}

export default function ProfileForm({ user, profile, academicSettings }: ProfileProps) {
  // --- STATE: PROFILE & AVATAR ---
  const [name, setName] = useState(profile?.full_name || "");
  const [isAnon, setIsAnon] = useState(profile?.is_anonymous ?? false);
  const [isParticipating, setIsParticipating] = useState(profile?.is_participating ?? true);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const { theme, toggleTheme } = useTheme();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE: PASSWORD ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);

  // --- NEW: NATIVE IMAGE SCALING HELPER ---
  // This function takes the raw file, redraws it on a small canvas, and returns a small Blob
  const scaleImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400; // Limit to 400px (Plenty for an avatar)
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to JPEG at 80% quality (Massive size reduction)
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Image compression failed"));
          }, "image/jpeg", 0.8);
        };
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // --- HANDLERS ---

  // [UPDATED] Now scales image before upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    try {
      const originalFile = e.target.files[0];

      // 1. Client-Side Compression
      const optimizedBlob = await scaleImage(originalFile);

      // 2. Prepare FormData with the smaller blob
      const formData = new FormData();
      // We force the name to .jpg because we converted it to JPEG above
      formData.append("file", optimizedBlob, "avatar.jpg");

      // 3. Upload
      const { publicUrl } = await uploadAvatar(formData);
      if (publicUrl) {
        setAvatarUrl(publicUrl);
        toast.success("Avatar updated!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      await updateProfile(name);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error("Failed to save changes");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePrivacyToggle = async () => {
    const newState = !isAnon;
    setIsAnon(newState);
    await togglePrivacy(newState);
    toast.success(newState ? "You are now hidden on leaderboards" : "You are now visible to the class");
  };

  const handleParticipationToggle = async () => {
    const newState = !isParticipating;
    setIsParticipating(newState);
    await toggleParticipation(newState);
    toast.success(newState ? "You joined the Leaderboard" : "You left the Leaderboard");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoadingPassword(true);
    try {
      await updateUserPassword(newPassword);
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoadingPassword(false);
    }
  };

  // --- RENDER (EXACT SAME AS BEFORE) ---
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto">

      {/* LEFT COLUMN: IDENTITY & PRIVACY */}
      <div className="space-y-6">

        {/* 1. PUBLIC PROFILE CARD */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Public Profile</h2>
          </div>

          {/* Avatar Uploader */}
          <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-8">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-700 group-hover:border-white transition-colors bg-gray-800">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <User className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
              />
            </div>

            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-300 mb-1">Profile Photo</p>
              <p>Click the circle to upload.</p>
            </div>
          </div>

          {/* Name Form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50"
                placeholder="Your Name"
              />
              <p className="text-[10px] text-gray-600">This is how you appear in the Class Chat and Leaderboard.</p>
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
              <Input
                value={user.email}
                disabled
                className="bg-[#111] border-gray-800 text-gray-500 cursor-not-allowed h-11"
              />
            </div>
            <div className="pt-2">
              <Button disabled={loadingProfile} className="w-full md:w-auto bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:opacity-90 font-bold border-0">
                {loadingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </div>

        {/* 2. PRIVACY SETTINGS CARD */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-white">Privacy Settings</h2>
          </div>

          <div className="space-y-4">
            {/* TOGGLE 1: VISIBILITY */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div className={cn("transition-opacity", !isParticipating && "opacity-50")}>
                <div className="font-bold text-gray-200 flex items-center gap-2">
                  {isAnon ? "Incognito" : "Visible"}
                  {isAnon ? <EyeOff className="w-4 h-4 text-yellow-500" /> : <Eye className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                  Hide your name on leaderboards.
                </p>
              </div>
              <Button
                type="button"
                onClick={handlePrivacyToggle}
                disabled={!isParticipating}
                variant="outline"
                size="sm"
                className={cn(
                  "border-gray-700 bg-transparent min-w-[90px]",
                  isAnon ? "text-yellow-500 hover:text-yellow-400" : "text-gray-400 hover:text-white"
                )}
              >
                {isAnon ? "Hidden" : "Public"}
              </Button>
            </div>

            {/* TOGGLE 2: PARTICIPATION */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
              <div>
                <div className="font-bold text-gray-200 flex items-center gap-2">
                  {isParticipating ? "Participating" : "Ghost Mode"}
                  {isParticipating ? <Trophy className="w-4 h-4 text-blue-500" /> : <Ghost className="w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                  Opt-out of ranking entirely.
                </p>
              </div>
              <Button
                type="button"
                onClick={handleParticipationToggle}
                variant="outline"
                size="sm"
                className={cn(
                  "border-gray-700 bg-transparent min-w-[90px]",
                  isParticipating ? "text-blue-500 hover:text-blue-400" : "text-red-400 hover:text-red-300"
                )}
              >
                {isParticipating ? "Active" : "Off"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SECURITY */}
      <div className="space-y-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-fit">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Security & Login</h2>
          </div>

          <p className="text-sm text-gray-400 mb-6">
            Update your password to keep your account secure. If you forgot your current password, you must logout and use the "Forgot Password" flow.
          </p>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/50 border-white/10 text-gray-200 h-11 focus:border-cyan-500/50"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-gray-800 mt-6">
              <Button
                disabled={loadingPassword || !newPassword}
                className="w-full bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 hover:text-red-300 h-11"
              >
                {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                Update Password
              </Button>
            </div>
          </form>
        </div>


        {/* 3. APPEARANCE (THEME) - PAUSED FOR NOW
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 h-fit mt-6">
          <div className="flex items-center gap-2 mb-6">
            <Palette className="w-5 h-5 text-purple-500" />
            <h2 className="text-lg font-bold text-white">Interface Theme</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
            <div>
              <div className="font-bold text-gray-200">
                {theme === "dark" ? "Dark Space (Aurora)" : "Light Ice (Glacial)"}
              </div>
              <p className="text-xs text-gray-500 mt-1 max-w-[200px]">
                Switch between the classic dark mode and the new high-visibility light mode.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-black/50 p-1 rounded-full border border-white/10">
              <button
                type="button"
                onClick={() => theme === 'light' && toggleTheme()}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                  theme === 'dark'
                    ? "bg-gray-700 text-white shadow-lg"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Ghost className="w-3 h-3" /> Dark
              </button>
              <button
                type="button"
                onClick={() => theme === 'dark' && toggleTheme()}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2",
                  theme === 'light'
                    ? "bg-slate-200 text-slate-800 shadow-lg"
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                <Sun className="w-3 h-3" /> Light
              </button>
            </div>
          </div>
        </div>
        */}

        {/* Academic Settings Card - if provided */}
        {academicSettings && academicSettings}
      </div>
    </div>
  );
}