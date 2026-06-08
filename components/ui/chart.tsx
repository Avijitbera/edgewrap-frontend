"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { [key in keyof any]: { label: string; color?: string; icon?: React.ComponentType } }
export type ChartConfig = Record<
  string,
  {
    label: React.ReactNode
    color?: string
    icon?: React.ComponentType
  }
>

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a ChartContainer")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
  }
>(({ id, className, config, children, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-grid-horizontal_line]:stroke-border [&_.recharts-cartesian-grid-vertical_line]:stroke-border [&_.recharts-curve.recharts-area]:fill-opacity-50 [&_.recharts-legend-item]:inline-flex [&_.recharts-legend-item]:items-center [&_.recharts-legend-item]:gap-1.5 [&_.recharts-legend-item_svg]:h-3 [&_.recharts-legend-item_svg]:w-3 [&_.recharts-legend-item_svg]:text-muted-foreground [&_.recharts-reference-line_line]:stroke-border [&_.recharts-sector]:stroke-background [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none [&_.recharts-tooltip-cursor]:stroke-border [&_.recharts-active-dot]:stroke-background [&_.recharts-active-dot]:stroke-2",
          className
        )}
        {...props}
      >
        <style dangerouslySetInnerHTML={{
          __html: `
            #${chartId} {
              ${Object.entries(config)
                .map(([key, value]) => {
                  return value.color ? `--color-${key}: ${value.color};` : ""
                })
                .join("\n")}
            }
          `
        }} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" id={chartId}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    active?: boolean
    payload?: any[]
    label?: string
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(
  (
    {
      active,
      payload,
      className,
      label,
      hideLabel = false,
      hideIndicator = false,
      indicator = "dot",
      nameKey,
      labelKey,
      ...props
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || "value"}`
      const itemConfig = config[key]
      const value =
        itemConfig?.label ||
        (labelKey ? (item.payload?.[labelKey] || label) : label)

      return <div className="font-medium">{value}</div>
    }, [label, labelKey, hideLabel, payload, config])

    if (!active || !payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
        {...props}
      >
        {!hideLabel && tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = config[key]
            const indicatorColor =
              itemConfig?.color || item.payload?.fill || item.color

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  "flex w-full items-center gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dashed" && "border-l-2 border-dashed"
                )}
                style={
                  indicator === "dashed"
                    ? ({
                        borderLeftColor: indicatorColor,
                      } as React.CSSProperties)
                    : undefined
                }
              >
                {!hideIndicator && (
                  <div
                    className={cn(
                      "shrink-0 rounded-[2px] border-[1.5px]",
                      indicator === "dot" && "h-2 w-2 rounded-full",
                      indicator === "line" && "w-1 h-2.5"
                    )}
                    style={{
                      backgroundColor: indicatorColor,
                      borderColor: indicatorColor,
                    }}
                  />
                )}
                <div className="flex flex-1 justify-between leading-none items-center gap-6">
                  <span className="text-muted-foreground">
                    {itemConfig?.label || item.name}
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {item.value}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: any[]
    verticalAlign?: "top" | "bottom"
    nameKey?: string
  }
>(({ className, payload, verticalAlign = "bottom", nameKey, ...props }, ref) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}
      {...props}
    >
      {payload.map((item, index) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = config[key]

        return (
          <div
            key={item.value || index}
            className="inline-flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
          >
            <div
              className="h-2 w-2 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: item.color,
              }}
            />
            <span className="text-muted-foreground text-xs leading-none">
              {itemConfig?.label || item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
}
