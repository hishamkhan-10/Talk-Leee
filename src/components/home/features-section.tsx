"use client";

import { motion } from "framer-motion";
import { Users, BarChart3, PhoneCall } from "lucide-react";

const features = [
  {
    icon: PhoneCall,
    title: "Outbound Calling",
    description: "Automated sales calls, lead qualification, and customer outreach with AI agents that sound human.",
    iconColor: "text-indigo-700 dark:text-indigo-300",
    iconBg: "bg-indigo-500/10",
    dotBg: "bg-indigo-500/70 dark:bg-indigo-400/70",
    points: [
      "Lead generation and qualification",
      "Sales appointment setting",
      "Customer surveys and feedback",
      "Event reminders and confirmations"
    ]
  },
  {
    icon: Users,
    title: "Inbound Support",
    description: "24/7 customer service with intelligent AI agents that can handle complex inquiries.",
    iconColor: "text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/10",
    dotBg: "bg-sky-500/70 dark:bg-sky-400/70",
    points: [
      "Customer support and helpdesk",
      "Order status and tracking",
      "Technical troubleshooting",
      "Account management"
    ]
  },
  {
    icon: BarChart3,
    title: "Voice Analytics",
    description: "Advanced analytics and insights to optimize your communication strategies.",
    iconColor: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/10",
    dotBg: "bg-emerald-500/70 dark:bg-emerald-400/70",
    points: [
      "Call performance metrics",
      "Sentiment analysis",
      "Conversation insights",
      "ROI tracking and reporting"
    ]
  }
];

export function FeaturesSection() {
  return (
    <section id="services" className="py-24 px-4 md:px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-foreground"
          >
            Our Services
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-muted-foreground"
          >
            Comprehensive AI voice solutions for every business need
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm hover:border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.iconBg} ${feature.iconColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {feature.description}
              </p>
              <ul className="space-y-3">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start text-muted-foreground text-sm">
                    <span className={`mr-2 mt-1.5 w-1.5 h-1.5 rounded-full ${feature.dotBg}`} />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
