import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { CalendarDays } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

interface BookingFormData {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  membersCount: number;
}

const BookTour: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<BookingFormData>({
    name: "",
    email: "",
    phoneNumber: "",
    city: "",
    membersCount: 1,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (data: BookingFormData) => {
    const errors: Record<string, string> = {};
    if (!data.name.trim()) errors.name = "Name is required";
    if (!data.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email";
    if (!data.phoneNumber.trim()) errors.phoneNumber = "Phone is required";
    else if (!/^\d{10}$/.test(data.phoneNumber)) errors.phoneNumber = "Enter a 10-digit phone number";
    if (!data.city.trim()) errors.city = "Departure city required";
    if (data.membersCount < 1 || data.membersCount > 20) errors.membersCount = "Members must be 1–20";
    return errors;
  };

  const handleChange = (field: keyof BookingFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the form errors");
      return;
    }

    // Temporary stub: show success and navigate home
    toast.success("Form validated — booking flow is next");
    setTimeout(() => navigate("/"), 900);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-start justify-center py-12 px-4">
      <ToastContainer position="top-right" autoClose={4000} />
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-sky-100 p-3">
            <CalendarDays className="h-5 w-5 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Book Tour</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow">
          <div>
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 ${formErrors.name ? "border-rose-400" : "border-slate-200"}`}
            />
            {formErrors.name && <p className="mt-1 text-sm text-rose-600">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 ${formErrors.email ? "border-rose-400" : "border-slate-200"}`}
            />
            {formErrors.email && <p className="mt-1 text-sm text-rose-600">{formErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              value={formData.phoneNumber}
              onChange={(e) => handleChange("phoneNumber", e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={`mt-1 w-full rounded-md border px-3 py-2 ${formErrors.phoneNumber ? "border-rose-400" : "border-slate-200"}`}
            />
            {formErrors.phoneNumber && <p className="mt-1 text-sm text-rose-600">{formErrors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Departure city</label>
            <input
              value={formData.city}
              onChange={(e) => handleChange("city", e.target.value)}
              className={`mt-1 w-full rounded-md border px-3 py-2 ${formErrors.city ? "border-rose-400" : "border-slate-200"}`}
            />
            {formErrors.city && <p className="mt-1 text-sm text-rose-600">{formErrors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Members</label>
            <input
              type="number"
              min={1}
              max={20}
              value={formData.membersCount}
              onChange={(e) => handleChange("membersCount", Number(e.target.value) || 1)}
              className={`mt-1 w-32 rounded-md border px-3 py-2 ${formErrors.membersCount ? "border-rose-400" : "border-slate-200"}`}
            />
            {formErrors.membersCount && <p className="mt-1 text-sm text-rose-600">{formErrors.membersCount}</p>}
          </div>

          <div className="pt-2">
            <button type="submit" className="w-full rounded-md bg-sky-600 px-4 py-2 text-white">Continue to payment</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookTour;
