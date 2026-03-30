package com.resortsuite.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebSettings;
import android.webkit.WebViewClient;
import android.widget.Toast;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;

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
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePath, WebChromeClient.FileChooserParams fileChooserParams) {
                filePathCallback = filePath;
                
                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                
                Intent chooser = Intent.createChooser(intent, "Choose File");
                startActivityForResult(chooser, FILE_CHOOSER_RESULT_CODE);
                return true;
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
        
        private File getDownloadFolder() {
            File vipatFolder = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "VIPAT Data");
            if (!vipatFolder.exists()) {
                vipatFolder.mkdirs();
            }
            return vipatFolder;
        }
        
        @JavascriptInterface
        public void downloadFile(String data, String filename, String mimeType) {
            try {
                File vipatFolder = getDownloadFolder();
                File file = new File(vipatFolder, filename);
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(data.getBytes("UTF-8"));
                fos.close();
                
                Toast.makeText(ctx, "บันทึกไฟล์สำเร็จ: " + filename, Toast.LENGTH_LONG).show();
                
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(Uri.fromFile(file), mimeType);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
            } catch (Exception e) {
                Toast.makeText(ctx, "บันทึกล้มเหลว: " + e.getMessage(), Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
        }
        
        @JavascriptInterface
        public void downloadPDF(String htmlContent, String filename) {
            try {
                File vipatFolder = getDownloadFolder();
                String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
                String pdfFilename = filename.replace(".html", "") + "_" + timestamp + ".html";
                File file = new File(vipatFolder, pdfFilename);
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(htmlContent.getBytes("UTF-8"));
                fos.close();
                
                Toast.makeText(ctx, "บันทึกรายงานสำเร็จ: " + pdfFilename, Toast.LENGTH_LONG).show();
                
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setDataAndType(Uri.fromFile(file), "text/html");
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                ctx.startActivity(i);
            } catch (Exception e) {
                Toast.makeText(ctx, "บันทึกล้มเหลว: " + e.getMessage(), Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
        }
        
        @JavascriptInterface
        public void saveImage(String base64Data, String filename) {
            try {
                File vipatFolder = getDownloadFolder();
                
                String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss").format(new Date());
                String imgFilename = filename + "_" + timestamp + ".jpg";
                File file = new File(vipatFolder, imgFilename);
                
                String base64Image = base64Data.replaceFirst("^data:image/[^;]+;base64,", "");
                byte[] imageBytes = android.util.Base64.decode(base64Image, android.util.Base64.DEFAULT);
                
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(imageBytes);
                fos.close();
                
                Toast.makeText(ctx, "บันทึกรูปภาพสำเร็จ: " + imgFilename, Toast.LENGTH_LONG).show();
            } catch (Exception e) {
                Toast.makeText(ctx, "บันทึกรูปล้มเหลว: " + e.getMessage(), Toast.LENGTH_LONG).show();
                e.printStackTrace();
            }
        }
        
        @JavascriptInterface
        public String getDownloadPath() {
            File vipatFolder = getDownloadFolder();
            return vipatFolder.getAbsolutePath();
        }
    }
}
