import { motion } from "framer-motion";

export function SuspenseSkeleton({ error }: { error: boolean }) {
  return (
    <div className="flex justify-center mt-8">
      <div className="flex items-center gap-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 272 275"
          className="h-16"
        >
          <defs>
            <linearGradient
              id="outerGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={error ? "#ff5252" : "#a8e063"} />
              <stop offset="100%" stopColor={error ? "#ff1744" : "#56ab2f"} />
            </linearGradient>
            <linearGradient
              id="innerGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#fff176" />
              <stop offset="100%" stopColor="#fbc02d" />
            </linearGradient>
          </defs>
          <motion.path
            d="M235.71,2H99.07c-16.66,0-30.16,13.5-30.16,30.16v39.65H30.66c-16.66,0-30.16,13.5-30.16,30.16v136.63c0,16.66,13.5,30.16,30.16,30.16h136.63c16.66,0,30.16-13.5,30.16-30.16v-39.65h38.26c16.66,0,30.16-13.5,30.16-30.16V32.16c0-16.66-13.5-30.16-30.16-30.16ZM233.58,153.27c0,8.64-7,15.64-15.64,15.64h-52.77v54.17c0,8.64-7,15.64-15.64,15.64H49.07c-8.64,0-15.64-7-15.64-15.64v-100.46c0-8.64,7-15.64,15.64-15.64h52.77v-54.17c0-8.64,7-15.64,15.64-15.64h100.46c8.64,0,15.64,7,15.64,15.64v100.46Z"
            fill="none"
            stroke="url(#outerGradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1400"
            strokeDashoffset="1400"
            animate={
              error
                ? { strokeDashoffset: [0] }
                : { strokeDashoffset: [1400, 0, 1400] }
            }
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ transform: "translateX(2px) translateY(2px)" }}
          />
          <motion.path
            d="M191.41,64.3h-52.19c-7.2,0-13.04,5.84-13.04,13.04v51.44c0,1.69-1.37,3.05-3.05,3.05h-49.47c-7.2,0-13.04,5.84-13.04,13.04v52.19c0,7.2,5.84,13.04,13.04,13.04h52.19c7.2,0,13.04-5.84,13.04-13.04v-51.44c0-1.69,1.37-3.05,3.05-3.05h49.47c7.2,0,13.04-5.84,13.04-13.04v-52.19c0-7.2-5.84-13.04-13.04-13.04Z"
            fill="url(#innerGradient)"
            strokeWidth="6"
            animate={error ? { opacity: [1] } : { opacity: [1, 0.8, 1] }}
            transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
            style={{ transform: "translateX(2px) translateY(2px)" }}
          />
        </svg>
        {error ? (
          <div>
            <div className="text-lg font-bold">Что-то сломалось!</div>
            <div className="text-muted-foreground font-medium text-sm">
              Не смогли получить топологию
            </div>
          </div>
        ) : (
          <div>
            <div className="text-lg font-bold">Тянем данные из vSphere</div>
            <div className="text-muted-foreground font-medium text-sm">
              Придется чуть-чуть подождать...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
