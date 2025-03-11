import BookingManager from "@/components/BookingManager";

export default function ManageBookings() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Hantera bokningar</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <BookingManager />
      </div>
    </div>
  );
}