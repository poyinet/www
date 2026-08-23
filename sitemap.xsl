<?xml version="1.0" encoding="UTF-8"?>
<!-- sitemap.xsl：浏览器中查看 sitemap.xml 的极简美化样式 -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html>
      <head>
        <title>破译 DECODE ARCADE · 站点地图</title>
        <meta charset="UTF-8"/>
        <style>
          body { font-family: ui-monospace, Consolas, monospace; background: #0a0a12; color: #d9e2f2; margin: 0; padding: 24px; }
          h1 { color: #00f0ff; font-size: 18px; letter-spacing: 2px; }
          p { color: #7a86a0; font-size: 12px; }
          ul { list-style: none; padding: 0; }
          li { padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.08); }
          a { color: #b967ff; text-decoration: none; font-size: 13px; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>🗺️ 破译 DECODE ARCADE · 站点地图</h1>
        <p>共 <xsl:value-of select="count(/sm:urlset/sm:url)"/> 个页面（纯前端静态站点）</p>
        <ul>
          <xsl:for-each select="/sm:urlset/sm:url">
            <li><a href="{sm:loc}"><xsl:value-of select="sm:loc"/></a></li>
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
