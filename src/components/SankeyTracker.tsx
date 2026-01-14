"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { addApplications, moveApplications, logInterviewOutcome } from "@/app/actions/career";
import AddInterviewDialog from "@/components/AddInterviewDialog";

interface CareerStats {
  pending_count: number;
  rejected_count: number;
  ghosted_count: number;
  oa_count: number; // NEW
  interview_count: number;
  offer_count: number;
  no_offer_count: number;
}

const getRibbonPath = (x1: number, y1Top: number, y1Bot: number, x2: number, y2Top: number, y2Bot: number) => {
  const tension = 0.5;
  const midX = x1 + (x2 - x1) * tension;
  return `M ${x1},${y1Top} C ${midX},${y1Top} ${midX},${y2Top} ${x2},${y2Top} L ${x2},${y2Bot} C ${midX},${y2Bot} ${midX},${y1Bot} ${x1},${y1Bot} Z`;
};

export default function SankeyTracker({ stats }: { stats: CareerStats | null }) {
  const [modalMode, setModalMode] = useState<"interview" | "oa" | null>(null);

  // 1. Data Parsing
  const pending = Number(stats?.pending_count || 0);
  const rejected = Number(stats?.rejected_count || 0);
  const ghosted = Number(stats?.ghosted_count || 0);
  const oa = Number(stats?.oa_count || 0);
  const interviews = Number(stats?.interview_count || 0);
  const offers = Number(stats?.offer_count || 0);
  const noOffers = Number(stats?.no_offer_count || 0);

  // 2. Totals
  const totalOutcomes = offers + noOffers;
  const activeInterviews = Math.max(interviews - totalOutcomes, 0); 
  const visualInterviewTotal = offers + noOffers + activeInterviews;
  
  // Note: We use this for scaling, but we force min-heights later
  const totalApps = pending + rejected + ghosted + oa + visualInterviewTotal;

  // 3. Layout Dimensions
  const CANVAS_HEIGHT = 600; 
  const CANVAS_WIDTH = 1000;
  
  const TOP_MARGIN = 40;
  const BOTTOM_MARGIN = 40;
  const GAP = 45; 

  // 4. Dynamic Scaling (Restored Skeleton Logic)
  const availableHeight = CANVAS_HEIGHT - (TOP_MARGIN + BOTTOM_MARGIN + (GAP * 4));
  const scale = totalApps > 0 ? availableHeight / totalApps : 0;
  const MIN_THICKNESS = 12; // Bars will ALWAYS be at least this thick

  // FIX: Allow 0 count to still return MIN_THICKNESS (The Skeleton)
  const getHeight = (count: number) => Math.max(count * scale, MIN_THICKNESS);

  const hRejected = getHeight(rejected);
  const hGhosted = getHeight(ghosted);
  const hOA = getHeight(oa); 
  const hPending = getHeight(pending);
  
  // For Interviews, we sum the parts to ensure alignment
  const hOffer = getHeight(offers);
  const hNoOffer = getHeight(noOffers);
  const hActiveInt = getHeight(activeInterviews);
  const hInterviewTotal = hOffer + hNoOffer + hActiveInt;

  // 5. EXPLICIT STACKING ENGINE
  
  // Calculate total stack height to center it
  const totalLeftHeight = hRejected + hGhosted + hOA + hInterviewTotal + hPending;
  const startLeftY = (CANVAS_HEIGHT - totalLeftHeight) / 2;

  // Manually calculate Y for every bar (Top to Bottom)
  const yReject = startLeftY;
  const yGhost = yReject + hRejected;
  const yOA = yGhost + hGhosted; // Insert OA here
  const yInter = yOA + hOA;
  const yPend = yInter + hInterviewTotal;

  const src = {
    rejected: { top: yReject, bot: yReject + hRejected },
    ghosted:  { top: yGhost, bot: yGhost + hGhosted },
    oa:       { top: yOA, bot: yOA + hOA },
    interview:{ top: yInter, bot: yInter + hInterviewTotal },
    pending:  { top: yPend, bot: yPend + hPending },
  };

  // Right Side Anchors
  const dstRejected_Top = TOP_MARGIN;
  const dstGhosted_Top = dstRejected_Top + hRejected + GAP;
  const dstOA_Top = dstGhosted_Top + hGhosted + GAP; // OA below Ghosted
  const dstPending_Top = CANVAS_HEIGHT - BOTTOM_MARGIN - hPending;

  // Center Float Logic
  const zoneTopEnd = dstOA_Top + hOA + GAP; 
  const zoneBottomStart = dstPending_Top - GAP;
  const middleCenter = (zoneTopEnd + zoneBottomStart) / 2;
  const dstInterview_Top = middleCenter - (hInterviewTotal / 2);

  // Sub-branch Logic
  const startOffer_Y = dstInterview_Top;
  const startActive_Y = startOffer_Y + hOffer;
  const startNoOffer_Y = startActive_Y + hActiveInt;

  const spread = 40;
  
  // Show branches if we have ANY interview activity (even just the bar)
  const showBranches = visualInterviewTotal > 0 || interviews > 0;
  const dstOffer_Top = dstInterview_Top - (showBranches ? spread : 0);
  const dstNoOffer_Top = dstInterview_Top + hOffer + hActiveInt + (showBranches ? spread : 0);

  const startX = 2;
  const middleX = 500; 
  const subBranchStartX = middleX - 2; 
  const endX = 900;

  const handleAction = async (type: string) => {
    if (type === "interview") setModalMode("interview");
    else if (type === "oa") setModalMode("oa");
    else if (type === "pending") await addApplications(1);
    else if (type === "offer") await logInterviewOutcome('offer');
    else if (type === "no_offer") await logInterviewOutcome('no_offer');
    else await moveApplications(type, 1);
  };

  return (
    <>
    <div className="w-full h-full bg-[#0a0a0a] border border-gray-800 rounded-2xl relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:50px_50px]" />
        
        <svg className="w-full h-full absolute inset-0 z-10" viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`} preserveAspectRatio="none">
            <defs>
                <linearGradient id="gReject" x1="0" x2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.4"/><stop offset="100%" stopColor="#ef4444" stopOpacity="0.7"/></linearGradient>
                <linearGradient id="gGhost" x1="0" x2="1"><stop offset="0%" stopColor="#6b7280" stopOpacity="0.4"/><stop offset="100%" stopColor="#6b7280" stopOpacity="0.7"/></linearGradient>
                <linearGradient id="gOA" x1="0" x2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.7"/></linearGradient>
                <linearGradient id="gPend" x1="0" x2="1"><stop offset="0%" stopColor="#eab308" stopOpacity="0.4"/><stop offset="100%" stopColor="#eab308" stopOpacity="0.7"/></linearGradient>
                <linearGradient id="gInt" x1="0" x2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.4"/><stop offset="100%" stopColor="#10b981" stopOpacity="0.7"/></linearGradient>
                <linearGradient id="gOffer" x1="0" x2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9"/></linearGradient>
                <linearGradient id="gNoOffer" x1="0" x2="1"><stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/><stop offset="100%" stopColor="#f97316" stopOpacity="0.9"/></linearGradient>
            </defs>

            {/* SOURCE BAR */}
            <rect x={0} y={src.rejected.top} width={8} height={totalLeftHeight} rx={2} fill="#3b82f6" className="opacity-50" />
            <text x={20} y={CANVAS_HEIGHT / 2} fill="white" className="text-[12px] font-bold opacity-30" style={{ writingMode: "vertical-rl", textAnchor: "middle" }}>
                APPS ({totalApps})
            </text>

            {/* --- MAIN RIBBONS (Always Render to maintain Skeleton) --- */}
            
            <Ribbon d={getRibbonPath(startX + 8, src.rejected.top, src.rejected.bot, middleX, dstRejected_Top, dstRejected_Top + hRejected)} fill="url(#gReject)" stroke="#ef4444" onClick={() => handleAction('rejected')} />
            <Label x={middleX + 10} y={dstRejected_Top + hRejected/2} text="Rejected" count={rejected} color="#ef4444" />

            <Ribbon d={getRibbonPath(startX + 8, src.ghosted.top, src.ghosted.bot, middleX, dstGhosted_Top, dstGhosted_Top + hGhosted)} fill="url(#gGhost)" stroke="#9ca3af" onClick={() => handleAction('ghosted')} />
            <Label x={middleX + 10} y={dstGhosted_Top + hGhosted/2} text="No Answer" count={ghosted} color="#9ca3af" />

            {/* OA LAYER */}
            <Ribbon d={getRibbonPath(startX + 8, src.oa.top, src.oa.bot, middleX, dstOA_Top, dstOA_Top + hOA)} fill="url(#gOA)" stroke="#8b5cf6" onClick={() => handleAction('oa')} />
            <Label x={middleX + 10} y={dstOA_Top + hOA/2} text="Online Assessment" count={oa} color="#8b5cf6" />

            <Ribbon d={getRibbonPath(startX + 8, src.pending.top, src.pending.bot, middleX, dstPending_Top, dstPending_Top + hPending)} fill="url(#gPend)" stroke="#eab308" onClick={() => handleAction('pending')} />
            <Label x={middleX + 10} y={dstPending_Top + hPending/2} text="Pending" count={pending} color="#eab308" />

            <Ribbon d={getRibbonPath(startX + 8, src.interview.top, src.interview.bot, middleX, dstInterview_Top, dstInterview_Top + hInterviewTotal)} fill="url(#gInt)" stroke="#10b981" onClick={() => handleAction('interview')} />
            <Label x={middleX - 50} y={dstInterview_Top + hInterviewTotal + 15} text="Interviews" count={visualInterviewTotal} color="#10b981" center />

            {/* --- SUB BRANCHES --- */}
            {/* Logic: Show branches if we have activity OR if we just want the skeleton to exist */}
            {showBranches && (
                <>
                    <Ribbon 
                        d={getRibbonPath(subBranchStartX, startOffer_Y, startOffer_Y + hOffer, endX, dstOffer_Top, dstOffer_Top + hOffer)} 
                        fill="url(#gOffer)" stroke="#3b82f6" onClick={() => handleAction('offer')} delay={0.1} 
                    />
                    <Label x={endX + 10} y={dstOffer_Top + hOffer/2} text="Offers" count={offers} color="#3b82f6" />

                    <Ribbon 
                        d={getRibbonPath(subBranchStartX, startNoOffer_Y, startNoOffer_Y + hNoOffer, endX, dstNoOffer_Top, dstNoOffer_Top + hNoOffer)} 
                        fill="url(#gNoOffer)" stroke="#f97316" onClick={() => handleAction('no_offer')} delay={0.2} 
                    />
                    <Label x={endX + 10} y={dstNoOffer_Top + hNoOffer/2} text="No Offer" count={noOffers} color="#f97316" />
                </>
            )}

        </svg>
    </div>
    
    <AddInterviewDialog 
        isOpen={modalMode !== null} 
        onClose={() => setModalMode(null)} 
        mode={modalMode || "interview"} 
    />
    </>
  );
}

function Ribbon({ d, fill, stroke, onClick, delay = 0 }: any) {
    return (
        <motion.path 
            d={d} fill={fill} stroke={stroke} strokeWidth={1} strokeOpacity={0.8}
            className="cursor-pointer hover:opacity-80 transition-all hover:stroke-white"
            onClick={onClick}
            initial={{ opacity: 0, pathLength: 0 }}
            animate={{ opacity: 1, pathLength: 1 }}
            transition={{ duration: 0.8, delay, ease: "easeOut" }}
        />
    )
}

function Label({ x, y, text, count, color, center }: any) {
    return (
        <motion.text 
            x={x} y={y} fill={color} className="text-[13px] font-mono font-medium select-none" dy="4" textAnchor={center ? "middle" : "start"}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        >
            {text} <tspan fontWeight="900" fill="white">({count})</tspan>
        </motion.text>
    )
}