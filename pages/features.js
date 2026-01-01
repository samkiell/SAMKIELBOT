import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import { featuresData, FEATURE_CATEGORIES } from "../lib/data/features";
import { FaArrowRight, FaCheckCircle, FaRocket } from "react-icons/fa";
import ImageViewer from "../components/ImageViewer";

export default function FeaturesPage() {
  const fadeUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  const staggerContainer = {
    initial: {},
    whileInView: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    viewport: { once: true },
  };

  const [selectedImage, setSelectedImage] = useState(null);

  const topCapabilities = featuresData.filter(
    (f) => f.category === FEATURE_CATEGORIES.TOP
  );
  const aiMediaTools = featuresData.filter(
    (f) => f.category === FEATURE_CATEGORIES.AI_MEDIA
  );
  const productivityTools = featuresData.filter(
    (f) => f.category === FEATURE_CATEGORIES.PRODUCTIVITY_FUN
  );

  const featureImages = {
    "view-once": "/features/deyplay.png",
    "video-downloader": "/features/video.png",
    "music-downloader": "/features/play.png",
    "high-quality": "/features/largevid.png",
    "zero-coding": "/features/zerocode.png",
    "cloud-uptime": "/features/graph.png",
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0f172a] min-h-screen text-gray-800 dark:text-gray-100">
      <Head>
        <title>Features | SAMKIEL BOT - Deployment Platform</title>
        <meta
          name="description"
          content="Explore the powerful features of SAMKIEL BOT - Deployment Platform. From View Once recovery and video downloading to AI tools and group moderation, everything works directly inside WhatsApp."
        />
      </Head>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-200 [mask-image:linear-gradient(0deg,#fff,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div {...fadeUp}>
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest mb-6">
              Product Showcase
            </span>
            <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight text-gray-900 dark:text-white leading-tight">
              Everything works inside <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                WhatsApp.
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
              No extra apps to install. No browser tools required.{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                Download, Automate, Create, and Moderate
              </span>{" "}
              directly from your favorite chat app.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4"
          >
            <Link
              href="/register"
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              Start Free Deployment <FaArrowRight className="text-sm" />
            </Link>
            <Link
              href="/commands"
              className="w-full sm:w-auto bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 px-10 py-4 rounded-xl font-semibold transition-all shadow-sm"
            >
              Command Reference
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Capabilities - Top Section */}
      <section className="py-16 md:py-24 px-6 bg-white dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
              Featured Capabilities
            </h2>
            <div className="w-20 h-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"></div>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
              The revolutionary tools that make SAMKIEL BOT the #1 choice for
              thousands of users.
            </p>
          </motion.div>

          {/* Special UI for Top Features */}
          <div className="grid grid-cols-1 gap-12">
            {topCapabilities.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className={`flex flex-col ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                } gap-12 items-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700/50 shadow-sm`}
              >
                <div className="flex-1 w-full">
                  <div className="text-4xl md:text-5xl mb-6 p-4 bg-white dark:bg-gray-800 rounded-2xl inline-block shadow-sm">
                    {feature.icon}
                  </div>
                  <h3 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {feature.workflow && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-sm">
                        How it works:
                      </h4>
                      <ul className="space-y-3">
                        {feature.workflow.map((step, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start gap-3 text-gray-700 dark:text-gray-200"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold mt-1">
                              {sIdx + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feature.subFeatures && (
                    <div className="flex flex-wrap gap-2 mt-6">
                      {feature.subFeatures.map((sub, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-sm font-medium border border-indigo-100 dark:border-indigo-800/50"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full h-[300px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/10 relative overflow-hidden group">
                  {featureImages[feature.id] ? (
                    <img
                      src={featureImages[feature.id]}
                      alt={feature.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                      onClick={() =>
                        setSelectedImage(featureImages[feature.id])
                      }
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-grid-slate-200/20 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]"></div>
                      <FaRocket className="text-9xl text-indigo-500/0 animate-bounce" />
                    </>
                  )}
                  {/* Tag */}
                  <div className="absolute bottom-4 right-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-xs font-mono text-indigo-600 dark:text-indigo-400 pointer-events-none">
                    FEATURE: {feature.id}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI & Media Tools Section */}
      <section className="py-16 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              AI & Advanced Media Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Harness the power of neural networks for stunning imagery and
              next-gen automation.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {aiMediaTools.map((feature) => (
              <motion.div
                key={feature.id}
                variants={fadeUp}
                className="group p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 flex items-center justify-center text-2xl mb-6 bg-gray-50 dark:bg-gray-900 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Productivity, Fun & Group Section */}
      <section className="py-16 md:py-24 px-6 bg-gray-100/50 dark:bg-gray-900/30">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Productivity, Fun & Group Tools
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Beyond utility, SAMKIEL BOT makes your WhatsApp experience more
              organized and entertaining.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {productivityTools.map((feature) => (
              <motion.div
                key={feature.id}
                variants={fadeUp}
                className="p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 flex items-center justify-center text-xl bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Command Scale Proof & CTA Section */}
      <section className="py-16 md:py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            {...fadeUp}
            className="p-12 md:p-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl text-center text-white relative overflow-hidden shadow-2xl"
          >
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                100+ Commands & <br />
                Always Growing.
              </h2>
              <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-2xl mx-auto opacity-90">
                Join our community-driven platform where new features are added
                based on your suggestions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
                <Link
                  href="/commands"
                  className="w-full sm:w-auto px-10 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  Browse Full Menu <FaArrowRight className="text-sm" />
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-10 py-4 bg-transparent text-white border-2 border-white/30 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Deploy Your Bot
                </Link>
              </div>

              <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-indigo-200">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Community Driven
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> Daily Updates
                </div>
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-400" /> 24/7 Reliability
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <ImageViewer
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
        src={selectedImage}
        alt="Feature Preview"
      />
    </div>
  );
}
