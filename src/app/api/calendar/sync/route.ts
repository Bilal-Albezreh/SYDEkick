import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
        return new NextResponse("Missing userId", { status: 400 });
    }

    const supabase = await createClient();

    // Fetch assessments with course names
    const { data: assessments, error } = await supabase
        .from("assessments")
        .select(`
      id,
      name,
      due_date,
      type,
      weight,
      courses (
        name
      )
    `)
        .eq("user_id", userId)
        .not("due_date", "is", null);

    if (error) {
        console.error("Error fetching assessments for iCal:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }

    // Format valid ISO 8601 date string (YYYYMMDDTHHmmSSZ)
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const events = assessments?.map((a: any) => {
        // Ensure we have a valid date
        if (!a.due_date) return '';

        const dtStart = new Date(a.due_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const courseName = a.courses?.name || "Course";

        return `BEGIN:VEVENT
UID:${a.id}@sydekick.ca
DTSTAMP:${now}
DTSTART:${dtStart}
SUMMARY:${courseName}: ${a.name}
DESCRIPTION:Type: ${a.type} | Weight: ${a.weight}%
END:VEVENT`;
    }).join('\n');

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SydeKick//Academic Weapon//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
${events}
END:VCALENDAR`;

    return new NextResponse(icsContent, {
        headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": "inline; filename=calendar.ics",
        },
    });
}
