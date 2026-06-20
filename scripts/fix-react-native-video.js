const fs = require('fs');
const path = require('path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-video',
  'android',
  'src',
  'main',
  'java',
  'com',
  'brentvatne',
  'exoplayer',
  'ReactExoplayerView.java',
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');

if (source.includes('private class RNVLoadControl implements androidx.media3.exoplayer.LoadControl')) {
  process.exit(0);
}

const pattern =
  /    private class RNVLoadControl extends DefaultLoadControl \{[\s\S]*?\n    private void initializePlayer\(\) \{/m;

if (!pattern.test(source)) {
  throw new Error('react-native-video patch target not found');
}

const replacement = `    private class RNVLoadControl implements androidx.media3.exoplayer.LoadControl {
        private final DefaultLoadControl delegate;
        private final int availableHeapInBytes;
        private final Runtime runtime;

        public RNVLoadControl(DefaultAllocator allocator, BufferConfig config) {
            this.delegate = new DefaultLoadControl.Builder()
                    .setAllocator(allocator)
                    .setBufferDurationsMs(
                            config.getMinBufferMs() != BufferConfig.Companion.getBufferConfigPropUnsetInt()
                                    ? config.getMinBufferMs()
                                    : DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
                            config.getMaxBufferMs() != BufferConfig.Companion.getBufferConfigPropUnsetInt()
                                    ? config.getMaxBufferMs()
                                    : DefaultLoadControl.DEFAULT_MAX_BUFFER_MS,
                            config.getBufferForPlaybackMs() != BufferConfig.Companion.getBufferConfigPropUnsetInt()
                                    ? config.getBufferForPlaybackMs()
                                    : DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
                            config.getBufferForPlaybackAfterRebufferMs() != BufferConfig.Companion.getBufferConfigPropUnsetInt()
                                    ? config.getBufferForPlaybackAfterRebufferMs()
                                    : DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS)
                    .setTargetBufferBytes(-1)
                    .setPrioritizeTimeOverSizeThresholds(true)
                    .setBackBuffer(
                            config.getBackBufferDurationMs() != BufferConfig.Companion.getBufferConfigPropUnsetInt()
                                    ? config.getBackBufferDurationMs()
                                    : DefaultLoadControl.DEFAULT_BACK_BUFFER_DURATION_MS,
                            DefaultLoadControl.DEFAULT_RETAIN_BACK_BUFFER_FROM_KEYFRAME)
                    .build();
            runtime = Runtime.getRuntime();
            ActivityManager activityManager = (ActivityManager) themedReactContext.getSystemService(ThemedReactContext.ACTIVITY_SERVICE);
            double maxHeap = config.getMaxHeapAllocationPercent() != BufferConfig.Companion.getBufferConfigPropUnsetDouble()
                    ? config.getMaxHeapAllocationPercent()
                    : DEFAULT_MAX_HEAP_ALLOCATION_PERCENT;
            availableHeapInBytes = (int) Math.floor(activityManager.getMemoryClass() * maxHeap * 1024 * 1024);
        }

        @Override
        public void onPrepared(androidx.media3.exoplayer.analytics.PlayerId playerId) {
            delegate.onPrepared(playerId);
        }

        @Override
        public void onPrepared() {
            delegate.onPrepared();
        }

        @Override
        public void onTracksSelected(androidx.media3.exoplayer.LoadControl.Parameters parameters, androidx.media3.exoplayer.source.TrackGroupArray trackGroupArray, androidx.media3.exoplayer.trackselection.ExoTrackSelection[] exoTrackSelections) {
            delegate.onTracksSelected(parameters, trackGroupArray, exoTrackSelections);
        }

        @Override
        public void onTracksSelected(androidx.media3.exoplayer.analytics.PlayerId playerId, androidx.media3.common.Timeline timeline, androidx.media3.exoplayer.source.MediaSource.MediaPeriodId mediaPeriodId, androidx.media3.exoplayer.Renderer[] renderers, androidx.media3.exoplayer.source.TrackGroupArray trackGroupArray, androidx.media3.exoplayer.trackselection.ExoTrackSelection[] exoTrackSelections) {
            delegate.onTracksSelected(playerId, timeline, mediaPeriodId, renderers, trackGroupArray, exoTrackSelections);
        }

        @Override
        public void onTracksSelected(androidx.media3.common.Timeline timeline, androidx.media3.exoplayer.source.MediaSource.MediaPeriodId mediaPeriodId, androidx.media3.exoplayer.Renderer[] renderers, androidx.media3.exoplayer.source.TrackGroupArray trackGroupArray, androidx.media3.exoplayer.trackselection.ExoTrackSelection[] exoTrackSelections) {
            delegate.onTracksSelected(timeline, mediaPeriodId, renderers, trackGroupArray, exoTrackSelections);
        }

        @Override
        public void onTracksSelected(androidx.media3.exoplayer.Renderer[] renderers, androidx.media3.exoplayer.source.TrackGroupArray trackGroupArray, androidx.media3.exoplayer.trackselection.ExoTrackSelection[] exoTrackSelections) {
            delegate.onTracksSelected(renderers, trackGroupArray, exoTrackSelections);
        }

        @Override
        public void onStopped(androidx.media3.exoplayer.analytics.PlayerId playerId) {
            delegate.onStopped(playerId);
        }

        @Override
        public void onStopped() {
            delegate.onStopped();
        }

        @Override
        public void onReleased(androidx.media3.exoplayer.analytics.PlayerId playerId) {
            delegate.onReleased(playerId);
        }

        @Override
        public void onReleased() {
            delegate.onReleased();
        }

        @Override
        public androidx.media3.exoplayer.upstream.Allocator getAllocator() {
            return delegate.getAllocator();
        }

        @Override
        public long getBackBufferDurationUs(androidx.media3.exoplayer.analytics.PlayerId playerId) {
            return delegate.getBackBufferDurationUs(playerId);
        }

        @Override
        public long getBackBufferDurationUs() {
            return delegate.getBackBufferDurationUs();
        }

        @Override
        public boolean retainBackBufferFromKeyframe(androidx.media3.exoplayer.analytics.PlayerId playerId) {
            return delegate.retainBackBufferFromKeyframe(playerId);
        }

        @Override
        public boolean retainBackBufferFromKeyframe() {
            return delegate.retainBackBufferFromKeyframe();
        }

        @Override
        public boolean shouldContinueLoading(androidx.media3.exoplayer.LoadControl.Parameters parameters) {
            return delegate.shouldContinueLoading(parameters);
        }

        @Override
        public boolean shouldContinueLoading(long playbackPositionUs, long bufferedDurationUs, float playbackSpeed) {
            if (bufferingStrategy == BufferingStrategy.BufferingStrategyEnum.DisableBuffering) {
                return false;
            } else if (bufferingStrategy == BufferingStrategy.BufferingStrategyEnum.DependingOnMemory) {
                int loadedBytes = getAllocator().getTotalBytesAllocated();
                boolean isHeapReached = availableHeapInBytes > 0 && loadedBytes >= availableHeapInBytes;
                if (isHeapReached) {
                    return false;
                }
                long usedMemory = runtime.totalMemory() - runtime.freeMemory();
                long freeMemory = runtime.maxMemory() - usedMemory;
                double minBufferMemoryReservePercent = source.getBufferConfig().getMinBufferMemoryReservePercent() != BufferConfig.Companion.getBufferConfigPropUnsetDouble()
                        ? source.getBufferConfig().getMinBufferMemoryReservePercent()
                        : ReactExoplayerView.DEFAULT_MIN_BUFFER_MEMORY_RESERVE;
                long reserveMemory = (long) minBufferMemoryReservePercent * runtime.maxMemory();
                long bufferedMs = bufferedDurationUs / (long) 1000;
                if (reserveMemory > freeMemory && bufferedMs > 2000) {
                    return false;
                }
                if (runtime.freeMemory() == 0) {
                    DebugLog.w(TAG, "Free memory reached 0, forcing garbage collection");
                    runtime.gc();
                    return false;
                }
            }
            return delegate.shouldContinueLoading(playbackPositionUs, bufferedDurationUs, playbackSpeed);
        }

        @Override
        public boolean shouldContinuePreloading(androidx.media3.common.Timeline timeline, androidx.media3.exoplayer.source.MediaSource.MediaPeriodId mediaPeriodId, long bufferedDurationUs) {
            return delegate.shouldContinuePreloading(timeline, mediaPeriodId, bufferedDurationUs);
        }

        @Override
        public boolean shouldStartPlayback(androidx.media3.exoplayer.LoadControl.Parameters parameters) {
            return delegate.shouldStartPlayback(parameters);
        }

        @Override
        public boolean shouldStartPlayback(androidx.media3.common.Timeline timeline, androidx.media3.exoplayer.source.MediaSource.MediaPeriodId mediaPeriodId, long bufferedDurationUs, float playbackSpeed, boolean rebuffering, long targetLiveOffsetUs) {
            return delegate.shouldStartPlayback(timeline, mediaPeriodId, bufferedDurationUs, playbackSpeed, rebuffering, targetLiveOffsetUs);
        }

        @Override
        public boolean shouldStartPlayback(long bufferedDurationUs, float playbackSpeed, boolean rebuffering, long targetLiveOffsetUs) {
            return delegate.shouldStartPlayback(bufferedDurationUs, playbackSpeed, rebuffering, targetLiveOffsetUs);
        }
    }

    private void initializePlayer() {
`;

const next = source.replace(pattern, replacement);
fs.writeFileSync(target, next);
