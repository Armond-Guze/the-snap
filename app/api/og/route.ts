import { ImageResponse } from 'next/og';
import React from 'react';

export const runtime = 'edge';

const clamp = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);

	const title = clamp(searchParams.get('title')?.trim() || 'The Snap', 120);
	const subtitle = clamp(searchParams.get('subtitle')?.trim() || 'NFL news, rankings, and analysis', 160);
	const category = clamp(searchParams.get('category')?.trim() || '', 40);
	const author = clamp(searchParams.get('author')?.trim() || '', 40);
	const date = clamp(searchParams.get('date')?.trim() || '', 40);

	const metaBits = [author, date].filter(Boolean).join(' • ');

	return new ImageResponse(
		React.createElement(
			'div',
			{ tw: 'flex h-[630px] w-[1200px] flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-16 text-slate-50' },
			React.createElement(
				'div',
				{ tw: 'flex flex-col gap-4' },
				React.createElement('div', { tw: 'text-[26px] font-bold uppercase tracking-[0.08em] text-slate-400' }, 'THE SNAP'),
				category
					? React.createElement(
							'div',
							{ tw: 'inline-flex items-center self-start rounded-full bg-blue-500/20 px-4 py-2 text-[20px] font-semibold text-blue-200' },
							category
						)
					: null,
				React.createElement('div', { tw: 'text-[64px] font-extrabold leading-[1.1]' }, title),
				React.createElement('div', { tw: 'max-w-[980px] text-[28px] leading-[1.4] text-slate-300' }, subtitle)
			),
			React.createElement('div', { tw: 'text-[22px] text-slate-400' }, metaBits)
		),
		{
			width: 1200,
			height: 630,
		}
	);
}
