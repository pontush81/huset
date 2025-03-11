import BookingManager from "@/components/BookingManager";

export default function ManageBookings() {
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Bokningsadministration</h2>
        <p className="text-gray-600">
          Här kan du hantera, bekräfta, avboka och exportera bokningar för gästlägenheten.
        </p>
      </div>
      
      <BookingManager />
    </div>
  );
}