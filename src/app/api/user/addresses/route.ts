import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

const MAX_ADDRESSES = 5;

// GET — fetch saved addresses for the authenticated user
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const user = await User.findOne({ email: session.user.email }).select('savedAddresses').lean();

        return NextResponse.json({ addresses: user?.savedAddresses || [] });
    } catch (error) {
        console.error('Addresses GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch addresses' }, { status: 500 });
    }
}

// POST — save a new address
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();
        const { label, name, phone, email, line1, line2, city, state, pincode, isDefault } = body;

        // Basic validation
        if (!name || !phone || !line1 || !city || !state || !pincode) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!/^\d{10}$/.test(phone)) {
            return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
        }
        if (!/^\d{6}$/.test(pincode)) {
            return NextResponse.json({ error: 'Invalid pincode' }, { status: 400 });
        }

        const user = await User.findOne({ email: session.user.email });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.savedAddresses.length >= MAX_ADDRESSES) {
            return NextResponse.json({ error: `Maximum ${MAX_ADDRESSES} addresses allowed` }, { status: 400 });
        }

        // If this is set as default, unset all others
        if (isDefault) {
            user.savedAddresses.forEach((addr) => {
                addr.isDefault = false;
            });
        }

        const newAddress = {
            label: label || 'Home',
            name, phone, email: email || '',
            line1, line2: line2 || '', city, state, pincode,
            isDefault: isDefault || user.savedAddresses.length === 0, // First address is default
        };

        user.savedAddresses.push(newAddress);
        await user.save();

        return NextResponse.json({ addresses: user.savedAddresses, message: 'Address saved' }, { status: 201 });
    } catch (error) {
        console.error('Addresses POST error:', error);
        return NextResponse.json({ error: 'Failed to save address' }, { status: 500 });
    }
}
