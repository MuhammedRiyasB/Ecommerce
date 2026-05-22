import React, { useState, useEffect } from 'react';
import { useAddAddressMutation, useUpdateAddressMutation } from '../addressApiSlice';
import type { Address, CreateAddressRequest } from '../addressApiSlice';
import { toast } from 'react-toastify';

interface AddressFormProps {
  initialData?: Address | null;
  onSuccess: (address: Address) => void;
  onCancel: () => void;
}

const AddressForm: React.FC<AddressFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const [addAddress, { isLoading: isAdding }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const isLoading = isAdding || isUpdating;

  const [form, setForm] = useState<CreateAddressRequest>({
    fullName: '',
    phoneNumber: '',
    pincode: '',
    houseName: '',
    place: '',
    postOffice: '',
    landMark: '',
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        fullName: initialData.fullName,
        phoneNumber: initialData.phoneNumber,
        pincode: initialData.pincode,
        houseName: initialData.houseName,
        place: initialData.place,
        postOffice: initialData.postOffice,
        landMark: initialData.landMark,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const normalizedValue =
      name === 'phoneNumber' || name === 'pincode'
        ? value.replace(/\D/g, '').slice(0, name === 'phoneNumber' ? 10 : 6)
        : value;
    setForm({ ...form, [name]: normalizedValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (initialData) {
        const response = await updateAddress({ addressId: initialData.addressId, body: form }).unwrap();
        toast.success('Address updated successfully');
        onSuccess(response.data);
      } else {
        const response = await addAddress(form).unwrap();
        toast.success('Address added successfully');
        onSuccess(response.data);
      }
    } catch {
      toast.error(`Failed to ${initialData ? 'update' : 'add'} address`);
    }
  };

  const fields = [
    { name: 'fullName', label: 'Full Name', placeholder: 'John Doe', required: true },
    { name: 'phoneNumber', label: 'Phone Number', placeholder: '9876543210', required: true },
    { name: 'pincode', label: 'Pincode', placeholder: '671316', required: true },
    { name: 'houseName', label: 'House / Flat / Building', placeholder: 'Flat 4B, Skyline Apartments', required: true },
    { name: 'place', label: 'City / Town', placeholder: 'Kozhikode', required: true },
    { name: 'postOffice', label: 'Post Office', placeholder: 'Mankavu P.O.', required: true },
    { name: 'landMark', label: 'Landmark', placeholder: 'Near City Mall', required: true },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-black uppercase tracking-wider text-gray-900 mb-4">{initialData ? 'Edit Address' : 'Add New Address'}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div key={field.name} className={field.name === 'houseName' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              {field.label}
            </label>
            <input
              type="text"
              name={field.name}
              value={(form as Record<string, string>)[field.name]}
              onChange={handleChange}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2.5 border border-gray-200 text-sm focus:outline-none focus:border-teal-600 transition-colors"
            />
          </div>
        ))}
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="bg-teal-600 text-white px-8 py-3 font-bold uppercase tracking-widest text-xs hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : initialData ? 'Update Address' : 'Save Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-3 border border-gray-300 font-bold uppercase tracking-widest text-xs text-gray-600 hover:border-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddressForm;
