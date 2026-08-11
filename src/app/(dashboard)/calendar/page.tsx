import Calendar from "@/components/calendar/Calendar";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function CalendarPage() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Calendario" />
      <Calendar />
    </div>
  );
}
