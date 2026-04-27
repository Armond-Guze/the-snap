import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { BRAND_LOGO_ALT, BRAND_LOGO_PATH } from '@/lib/site-config'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-[100svh] bg-[#070b10] text-white">
      <div className="relative">
        <div className="mx-auto flex max-w-6xl items-center px-5 py-5">
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <span className="mr-2 text-xl leading-none">‹</span>
            Back
          </Link>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-[linear-gradient(90deg,rgba(14,165,233,0)_0%,rgba(56,189,248,0.28)_16%,rgba(56,189,248,0.72)_50%,rgba(56,189,248,0.28)_84%,rgba(14,165,233,0)_100%)]" />
      </div>

      <div className="mx-auto flex min-h-[calc(100svh-73px)] w-full max-w-6xl items-start justify-center px-5 pt-7 pb-12 sm:pt-9">
        <div className="w-full max-w-[500px]">
          <div className="mb-5 flex justify-center">
            <Image
              src={BRAND_LOGO_PATH}
              alt={BRAND_LOGO_ALT}
              width={220}
              height={57}
              priority
              className="h-auto w-[144px] sm:w-[168px]"
            />
          </div>

          <div className="mb-4 text-center">
            <h1 className="text-[1.02rem] font-semibold leading-tight tracking-tight text-white sm:text-[2.15rem]">
              {title}
            </h1>
            <p className="mx-auto mt-2 max-w-[23rem] text-[0.74rem] leading-5 text-white/62 sm:text-[0.9rem]">
              {subtitle}
            </p>
          </div>

          <div className="mx-auto w-full max-w-[404px]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
