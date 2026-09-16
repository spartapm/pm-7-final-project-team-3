"use client";

import { useRouter } from "next/navigation";
import { Back, Gate, PhoneShell, TabBar } from "@/components/ui";
import { track } from "@/lib/ga";

export default function SupportPage() {
  const router = useRouter();
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/me" /><h1>고객센터</h1><span style={{ width: 36 }} /></div>
        <div className="scroll tabbed">
          <div className="menu-group">
            <div className="k">문의</div>
            <div className="menu">
              <button
                type="button"
                onClick={() => {
                  track("my_menu_select", { menu_type: "cs_inquiry" });
                  router.push("/me/cs");
                }}
              >
                1:1 문의 <span>›</span>
              </button>
            </div>
          </div>
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
