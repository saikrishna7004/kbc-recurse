import { NextResponse } from 'next/server';
import connectMongo from '@/utils/connectMongo';
import Question from '@/models/Question';

export async function GET(request, { params }) {
    const { slug } = params; // You can keep this as it is since GET is not affected by the same issue.

    try {
        await connectMongo();
        const question = await Question.findById(slug);
        
        if (!question) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: question }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function PUT(request, { params }) {
    const { slug } = await params;
    
    try {
        const body = await request.json();
        await connectMongo();
        
        const updatedQuestion = await Question.findByIdAndUpdate(
            slug,
            body,
            { new: true, runValidators: true }
        );
        
        if (!updatedQuestion) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: updatedQuestion }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function DELETE(request, { params }) {
    const { slug } = await params;
    
    try {
        await connectMongo();
        const deletedQuestion = await Question.findByIdAndDelete(slug);
        
        if (!deletedQuestion) {
            return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true, data: {} }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
