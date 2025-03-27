import { NextResponse } from 'next/server';
import connectMongo from '@/utils/connectMongo';
import Question from '@/models/Question';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const unused = searchParams.get('unused');
    const random = searchParams.get('random');

    try {
        await connectMongo();
        
        let query = {};
        
        if (level) {
            query.level = parseInt(level);
        }
        
        if (unused === 'true') {
            query.used = false;
        }
        
        let questions;
        
        if (random === 'true') {
            questions = await Question.aggregate([
                { $match: query },
                { $sample: { size: 1 } }
            ]);
        } else {
            questions = await Question.find(query).sort({ createdAt: -1 });
        }
        
        return NextResponse.json({ success: true, data: questions }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        await connectMongo();
        
        const question = await Question.create(body);
        return NextResponse.json({ success: true, data: question }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
}
