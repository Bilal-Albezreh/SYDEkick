"use client";

import { useState, useRef } from "react";
import { updateProfile, togglePrivacy, updateUserPassword, uploadAvatar, toggleParticipation } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// FIXED IMPORT: Added Trophy and Ghost
import { User, Shield, Save, Loader2, Eye, EyeOff, Lock, KeyRound, Camera, Ghost, Trophy } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileProps {
  user: {
    email: string;
  };
  profile: {
    full_name: string;
    is_anonymous: boolean;
    avatar_url: string | null;
    is_participating: boolean;
  };
}

export default function ProfileForm({ user, profile }: ProfileProps) {
  // --- STATE: PROFILE & AVATAR ---
  const [name, setName] = useState(profile.full_name || "");
  const [isAnon, setIsAnon] = useState(profile.is_anonymous);
  const [isParticipating, setIsParticipating] = useState(profile.is_participating ?? true);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE: PASSWORD ---
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPassword, setLoadingPassword] = useState(false);


  // --- HANDLER: AVATAR UPLOAD ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
        await uploadAvatar(formData);
        const objectUrl = URL.createObjectURL(file);
        setAvatarUrl(objectUrl); 
        toast.success("Avatar updated!");
    } catch (error) {
        console.error(error);
        toast.error("Failed to upload image");
    } finally {
        setUploading(false);
    }
  };

  // --- HANDLER: SAVE PROFILE NAME ---
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

  // --- HANDLER: TOGGLE PRIVACY (ANONYMOUS) ---
  const handlePrivacyToggle = async () => {
    const newState = !isAnon;
    setIsAnon(newState);
    await togglePrivacy(newState);
    toast.success(newState ? "You are now hidden on leaderboards" : "You are now visible to the class");
  };

  // --- HANDLER: TOGGLE PARTICIPATION (OPT-OUT) ---
  const handleParticipationToggle = async () => {
    const newState = !isParticipating;
    setIsParticipating(newState);
    await toggleParticipation(newState);
    toast.success(newState ? "You joined the Leaderboard" : "You left the Leaderboard");
  };

  // --- HANDLER: UPDATE PASSWORD ---
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

  return (
    <div className="space-y-8 max-w-2xl pb-10">
      
      {/* SECTION 1: PUBLIC PROFILE */}
      <div className="bg-[#191919] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-white">Public Profile</h2>
        </div>

        {/* Avatar Uploader */}
        <div className="flex items-center gap-6 mb-8 border-b border-gray-800 pb-8">
            <div 
                className="relative group cursor-pointer"
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
                <p className="text-xs text-gray-600 mt-1">Recommended: Square PNG or JPG.</p>
            </div>
        </div>

        {/* Name Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Display Name</label>
                <Input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-[#111] border-gray-700 text-white h-11"
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
                <Button disabled={loadingProfile} className="bg-white text-black hover:bg-gray-200 font-bold">
                    {loadingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Profile
                </Button>
            </div>
        </form>
      </div>


      {/* SECTION 2: PRIVACY SETTINGS */}
      <div className="bg-[#191919] border border-gray-800 rounded-xl p-6">
         <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold text-white">Privacy Settings</h2>
        </div>

        <div className="space-y-4">
            
            {/* TOGGLE 1: VISIBILITY */}
            <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg border border-gray-800">
                <div className={cn("transition-opacity", !isParticipating && "opacity-50")}>
                    <div className="font-bold text-gray-200 flex items-center gap-2">
                        {isAnon ? "Incognito Mode" : "Public Visibility"}
                        {isAnon ? <EyeOff className="w-4 h-4 text-yellow-500" /> : <Eye className="w-4 h-4 text-green-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        Hide your name (show as 'Anonymous') but keep your rank.
                    </p>
                </div>
                
                <Button 
                    type="button"
                    onClick={handlePrivacyToggle}
                    disabled={!isParticipating}
                    variant="outline"
                    className={cn(
                        "border-gray-700 bg-transparent min-w-[100px]",
                        isAnon ? "text-yellow-500 hover:text-yellow-400" : "text-gray-400 hover:text-white"
                    )}
                >
                    {isAnon ? "Turn Off" : "Turn On"}
                </Button>
            </div>

            {/* TOGGLE 2: PARTICIPATION (GHOST MODE) */}
            <div className="flex items-center justify-between p-4 bg-[#111] rounded-lg border border-gray-800">
                <div>
                    <div className="font-bold text-gray-200 flex items-center gap-2">
                        {isParticipating ? "Leaderboard Access" : "Ghost Mode"}
                        {isParticipating ? <Trophy className="w-4 h-4 text-blue-500" /> : <Ghost className="w-4 h-4 text-gray-500" />}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm">
                        {isParticipating 
                            ? "You are ranked against other students."
                            : "You are removed from the leaderboard entirely."}
                    </p>
                </div>
                
                <Button 
                    type="button"
                    onClick={handleParticipationToggle}
                    variant="outline"
                    className={cn(
                        "border-gray-700 bg-transparent min-w-[100px]",
                        isParticipating ? "text-blue-500 hover:text-blue-400" : "text-red-400 hover:text-red-300"
                    )}
                >
                    {isParticipating ? "Active" : "Disabled"}
                </Button>
            </div>

        </div>
      </div>


      {/* SECTION 3: SECURITY */}
      <div className="bg-[#191919] border border-gray-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-bold text-white">Security</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                    <Input 
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-[#111] border-gray-700 text-white h-11"
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
                        className="bg-[#111] border-gray-700 text-white h-11"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>
            </div>

            <div className="pt-2">
                <Button 
                    disabled={loadingPassword || !newPassword} 
                    className="bg-red-900/10 text-red-400 border border-red-900/50 hover:bg-red-900/20 hover:text-red-300"
                >
                    {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                    Update Password
                </Button>
            </div>
        </form>
      </div>

    </div>
  );
}