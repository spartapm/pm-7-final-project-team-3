"use client";

import { Back, Gate, PhoneShell, TabBar } from "@/components/ui";
import { track } from "@/lib/ga";
import { useStore } from "@/lib/store";

export default function AlertSettings() {
  const { alerts, setAlerts } = useStore();
  const payOn = alerts.pay || alerts.trial;
  return (
    <Gate>
      <PhoneShell>
        <div className="topbar"><Back href="/me" /><h1>알림 설정</h1><span style={{ width: 36 }} /></div>
        <div className="scroll tabbed">
          <div className="alert-sec">결제 알림</div>
          <div className="alert-card">
            <button
              className="alert-row"
              type="button"
              onClick={() => {
                const next = !payOn;
                setAlerts({ pay: next, trial: next });
                track("notification_setting_update", { setting_type: "payment_renewal", setting_status: next ? "on" : "off" });
              }}
            >
              <span>
                <b>결제 예정 알림 수신동의</b>
                <span className="sub">모든 서비스의 예정 알림을 받을 수 있어요</span>
              </span>
              <span className={`switch ${payOn ? "on" : ""}`}><i /></span>
            </button>
            <button
              className="alert-row"
              type="button"
              onClick={() => {
                const next = !alerts.renew;
                setAlerts({ renew: next });
                track("notification_setting_update", { setting_type: "price_change", setting_status: next ? "on" : "off" });
              }}
            >
              <span>
                <b>가격 변동 알림 수신동의</b>
                <span className="sub">요금제 변경을 감지하면 알려드려요</span>
              </span>
              <span className={`switch ${alerts.renew ? "on" : ""}`}><i /></span>
            </button>
          </div>
          <div className="alert-sec">서비스 알림</div>
          <div className="alert-card">
            <button
              className="alert-row"
              type="button"
              onClick={() => {
                const next = !alerts.calendar;
                setAlerts({ calendar: next });
                track("notification_setting_update", { setting_type: "calendar", setting_status: next ? "on" : "off" });
              }}
            >
              <span>
                <b>캘린더 알림 수신동의</b>
                <span className="sub">등록한 일정 정보를 30분 전에 알려드려요</span>
              </span>
              <span className={`switch ${alerts.calendar ? "on" : ""}`}><i /></span>
            </button>
          </div>
          <div className="alert-sec">마케팅 알림</div>
          <div className="alert-card">
            <button
              className="alert-row"
              type="button"
              onClick={() => {
                const next = !alerts.marketing;
                setAlerts({ marketing: next, benefit: next });
                track("notification_setting_update", { setting_type: "marketing", setting_status: next ? "on" : "off" });
              }}
            >
              <span>
                <b>혜택 및 이벤트 알림 수신동의</b>
                <span className="sub">새로운 혜택 정보를 알려드려요</span>
              </span>
              <span className={`switch ${alerts.marketing ? "on" : ""}`}><i /></span>
            </button>
          </div>
        </div>
        <TabBar />
      </PhoneShell>
    </Gate>
  );
}
