import { onRequestGet as __api_daily__date__ts_onRequestGet } from "G:\\code\\Recipe\\functions\\api\\daily\\[date].ts"
import { onRequestGet as __api_recipes__id__ts_onRequestGet } from "G:\\code\\Recipe\\functions\\api\\recipes\\[id].ts"
import { onRequestPost as __api_generate_ts_onRequestPost } from "G:\\code\\Recipe\\functions\\api\\generate.ts"
import { onRequestGet as __api_recipes_ts_onRequestGet } from "G:\\code\\Recipe\\functions\\api\\recipes.ts"
import { onRequestGet as __categories__name__ts_onRequestGet } from "G:\\code\\Recipe\\functions\\categories\\[name].ts"
import { onRequestGet as __daily__date__ts_onRequestGet } from "G:\\code\\Recipe\\functions\\daily\\[date].ts"
import { onRequestGet as __recipes__slug__ts_onRequestGet } from "G:\\code\\Recipe\\functions\\recipes\\[slug].ts"
import { onRequestGet as __categories_ts_onRequestGet } from "G:\\code\\Recipe\\functions\\categories.ts"
import { onRequestGet as __recipes_ts_onRequestGet } from "G:\\code\\Recipe\\functions\\recipes.ts"
import { onRequestGet as __robots_txt_ts_onRequestGet } from "G:\\code\\Recipe\\functions\\robots.txt.ts"
import { onRequestGet as __rss_xml_ts_onRequestGet } from "G:\\code\\Recipe\\functions\\rss.xml.ts"
import { onRequestGet as __sitemap_xml_ts_onRequestGet } from "G:\\code\\Recipe\\functions\\sitemap.xml.ts"
import { onRequest as ___middleware_js_onRequest } from "G:\\code\\Recipe\\functions\\_middleware.js"

export const routes = [
    {
      routePath: "/api/daily/:date",
      mountPath: "/api/daily",
      method: "GET",
      middlewares: [],
      modules: [__api_daily__date__ts_onRequestGet],
    },
  {
      routePath: "/api/recipes/:id",
      mountPath: "/api/recipes",
      method: "GET",
      middlewares: [],
      modules: [__api_recipes__id__ts_onRequestGet],
    },
  {
      routePath: "/api/generate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_generate_ts_onRequestPost],
    },
  {
      routePath: "/api/recipes",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_recipes_ts_onRequestGet],
    },
  {
      routePath: "/categories/:name",
      mountPath: "/categories",
      method: "GET",
      middlewares: [],
      modules: [__categories__name__ts_onRequestGet],
    },
  {
      routePath: "/daily/:date",
      mountPath: "/daily",
      method: "GET",
      middlewares: [],
      modules: [__daily__date__ts_onRequestGet],
    },
  {
      routePath: "/recipes/:slug",
      mountPath: "/recipes",
      method: "GET",
      middlewares: [],
      modules: [__recipes__slug__ts_onRequestGet],
    },
  {
      routePath: "/categories",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__categories_ts_onRequestGet],
    },
  {
      routePath: "/recipes",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__recipes_ts_onRequestGet],
    },
  {
      routePath: "/robots.txt",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__robots_txt_ts_onRequestGet],
    },
  {
      routePath: "/rss.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__rss_xml_ts_onRequestGet],
    },
  {
      routePath: "/sitemap.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__sitemap_xml_ts_onRequestGet],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [___middleware_js_onRequest],
      modules: [],
    },
  ]