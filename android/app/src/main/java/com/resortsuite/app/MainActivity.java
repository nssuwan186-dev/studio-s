package com.resortsuite.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.webkit.FileChooser;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;

public class MainActivity extends Activity {
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private int FILE_CHOOSER_RESULT_CODE = 100;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(false);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        
        webView.addJavascriptInterface(new DownloadInterface(this), "AndroidDownload");
        
        webView.setWebViewClient(new WebViewClient());
        
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePath, FileChooserParams fileChooserParams) {
                filePathCallback = filePath;
                
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                
                Intent chooser = Intent.createChooser(intent, "Choose File");
                startActivityForResult(chooser, FILE_CHOOSER_RESULT_CODE);
                return true;
            }
        });
        
        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                if (url.startsWith("blob:")) {
                    Toast.makeText(MainActivity.this, "กำลังดาวน์โหลด...", Toast.LENGTH_SHORT).show();
                } else {
                    Intent i = new Intent(Intent.ACTION_VIEW);
                    i.setData(Uri.parse(url));
                    startActivity(i);
                }
            }
        });
        
        webView.loadUrl("file:///android_asset/public/index.html");
    }
    
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == FILE_CHOOSER_RESULT_CODE) {
            if (filePathCallback != null) {
                if (resultCode == Activity.RESULT_OK) {
                    if (data != null) {
                        filePathCallback.onReceiveValue(new Uri[]{data.getData()});
                    } else {
                        filePathCallback.onReceiveValue(new Uri[]{});
                    }
                } else {
                    filePathCallback.onReceiveValue(new Uri[]{});
                }
                filePathCallback = null;
            }
        }
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    class DownloadInterface {
        private Context ctx;
        DownloadInterface(Context c) { ctx = c; }
        
        @JavascriptInterface
        public void downloadFile(String data, String filename, String mimeType) {
            try {
                File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                if (!downloadsDir.exists()) {
                    downloadsDir.mkdirs();
                }
                
                File file = new File(downloadsDir, filename);
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(data.getBytes("UTF-8"));
                fos.close();
                
                Toast.makeText(ctx, "ดาวน์โหลดไฟล์สำเร็จ: " + filename, Toast.LENGTH_LONG).show();
                
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(Uri.fromFile(file), mimeType);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
            } catch (Exception e) {
                Toast.makeText(ctx, "ดาวน์โหลดล้มเหลว: " + e.getMessage(), Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
        }
    }
}
