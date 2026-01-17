
export default function LoginModal(){
    
return (
<section className="flex items-center">
              <div className="w-full max-w-xl">
                <div className="relative h-full rounded-2xl border border-white/60 bg-white/25 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_18px_55px_-26px_rgba(15,23,42,0.55)] p-7 sm:p-8">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/45 via-white/10 to-transparent"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-teal-500/15"
                  />

                  <div className="relative h-full flex flex-col justify-center">
                    <div>
                      <div className="text-2xl font-extrabold text-slate-900">
                        Sign in
                      </div>
                      <div className="mt-1 text-sm text-slate-700/80">
                        Use the account provided by admin
                      </div>
                    </div>

                    {!!statusMessage && (
                      <div className="mt-4 rounded-xl border border-white/50 bg-white/50 px-4 py-3 text-sm text-slate-800">
                        {statusMessage}
                      </div>
                    )}

                    <form onSubmit={onSubmit} className="mt-6 space-y-5">
                      <div className="space-y-1">
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-slate-800"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="username"
                          placeholder="you@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30"
                        />
                        {!!errors.email && (
                          <p className="text-xs font-semibold text-rose-600">
                            {errors.email}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label
                          htmlFor="password"
                          className="block text-sm font-semibold text-slate-800"
                        >
                          Password
                        </label>
                        <input
                          id="password"
                          name="password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          className="w-full rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/30"
                        />
                        {!!errors.password && (
                          <p className="text-xs font-semibold text-rose-600">
                            {errors.password}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="remember"
                            checked={remember}
                            onChange={(e) => setRemember(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500/30"
                          />
                          <span className="text-sm text-slate-800">
                            Remember me
                          </span>
                        </label>

                        <a
                          href="/forgot-password"
                          className="text-sm font-semibold text-teal-800 hover:text-teal-900 transition"
                        >
                          Forgot password
                        </a>
                      </div>

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-teal-600/25 hover:bg-teal-700 transition focus:outline-none focus:ring-4 focus:ring-teal-500/30"
                      >
                        Log in
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </section>
)
}